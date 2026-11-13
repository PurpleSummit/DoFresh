from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponseRedirect
from django.urls import reverse
from django.db.models import Count, Q
from django.contrib.auth import authenticate, login, logout
from .forms import DoFreshUserCreationForm
from django.contrib.postgres.aggregates import ArrayAgg
from datetime import datetime, timezone
import html
import re

from freshapp.models import *

# Create your views here.
import os, json
from datetime import datetime
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=API_KEY)


# Layout
def last_date_api(request):
    if request.user.is_authenticated:
        return JsonResponse({"last_accessed_date": request.user.last_accessed_date})
    return HttpResponseRedirect(reverse("login"))


def set_last_date(request):
    if request.user.is_authenticated and request.method == "POST":
        today = datetime.now(timezone.utc).isoformat()

        request.user.last_accessed_date = today
        request.user.save()

        return JsonResponse({"last_accessed_date": request.user.last_accessed_date})
    return HttpResponseRedirect(reverse("login"))


def record(request):
    if request.user.is_authenticated and request.method == "POST":
        now_utc = datetime.now(timezone.utc)
        today_iso = now_utc.isoformat()
        today_date = now_utc.date()

        if not request.user.last_accessed_date:
            request.user.last_accessed_date = today_iso
            request.user.save(update_fields=["last_accessed_date"])
            return JsonResponse({"response": "last_accessed_str is null, no data yet"})

        last_accessed_str = str(request.user.last_accessed_date)
        last_date = parse_utc_to_date(last_accessed_str)
        diff = (today_date - last_date).days

        annotated_lists = request.user.todo_lists.annotate(
            total_tasks=Count("tasks", distinct=True),
            completed_on_date=Count(
                "tasks",
                filter=Q(
                    tasks__completed_date=last_accessed_str,
                    tasks__completed_for_good=False,
                ),
                distinct=True,
            ),
            inactive_tasks=Count(
                "tasks",
                filter=Q(tasks__active=False, tasks__completed_for_good=False)
                | Q(
                    tasks__completed_for_good=True,
                    tasks__completed_date=last_accessed_str,
                ),
                distinct=True,
            ),
        )

        total_tasks_num = 0
        total_tasks_completed = 0
        total_lists_completed = 0

        for l in annotated_lists:
            total_tasks_num += l.total_tasks

            # If not refreshing, get only the tasks completed on the date
            list_completed = l.completed_on_date
            if l.refreshing:
                # If refreshing, add (completed_for_good tasks that were completed that day) and (all completed & !completed_for_good tasks)
                list_completed = l.inactive_tasks

            total_tasks_completed += list_completed

            if list_completed > 0:
                total_lists_completed += 1

        refreshing_lists = request.user.todo_lists.filter(
            refreshing=True
        ).prefetch_related("tasks")

        for todo_list in refreshing_lists:
            # 1. Processing active tasks
            for task in todo_list.tasks.filter(active=True):
                completed_date_ranges = list(task.completed_dates or [])
                if completed_date_ranges:
                    recent_completed_pair = completed_date_ranges[-1]

                    # If task streak is active
                    if (
                        isinstance(recent_completed_pair, (list, tuple))
                        and len(recent_completed_pair) > 1
                    ):
                        if recent_completed_pair and recent_completed_pair[1] is None:
                            previous_date = datetime.fromisoformat(last_accessed_str) - timedelta(days=1)
                            completed_date_ranges[-1][1] = previous_date.isoformat()

                            task.completed_dates = completed_date_ranges
                            task.save(update_fields=["completed_dates"])

            # 2. Processing completed tasks
            for task in todo_list.tasks.filter(active=False):
                if task.completed_for_good:
                    continue

                completed_date_ranges = list(task.completed_dates or [])

                if diff > 1:
                    if (
                        completed_date_ranges
                        and isinstance(completed_date_ranges[-1], (list, tuple))
                        and len(completed_date_ranges[-1]) > 1
                        and completed_date_ranges[-1][1] is None
                    ):
                        completed_date_ranges[-1][1] = last_accessed_str
                    else:
                        completed_date_ranges.append(
                            [last_accessed_str, last_accessed_str]
                        )
                else:
                    if len(completed_date_ranges) > 1:
                        # If there was a closed streak, start another
                        if (
                            completed_date_ranges[-1]
                            and completed_date_ranges[-1][1] is not None
                        ):
                            completed_date_ranges.append([last_accessed_str, None])
                        # Else don't do anything
                    else:
                        completed_date_ranges = [[last_accessed_str, None]]

                task.completed_dates = completed_date_ranges
                task.active = True
                task.save(update_fields=["completed_dates", "active"])

        request.user.last_accessed_date = today_iso
        request.user.save(update_fields=["last_accessed_date"])

        return JsonResponse(
            {
                "total_tasks_num": total_tasks_num,
                "total_lists_num": annotated_lists.count(),
                "total_tasks_completed": total_tasks_completed,
                "total_lists_completed": total_lists_completed,
            }
        )
    return HttpResponseRedirect(reverse("login"))


# Index Page Functions
def index(request):
    if request.user.is_authenticated:
        return render(request, "freshapp/index.html")
    return HttpResponseRedirect(reverse("login"))


def lists_api(request):
    if request.user.is_authenticated:
        todo_lists = (
            request.user.todo_lists.all()
            .only("id", "title", "refreshing")
            .values("id", "title", "refreshing")
            .iterator()
        )
        return JsonResponse({"todo-lists": list(todo_lists)}, safe=False)


def tasks_api(request):
    try:
        list_id = request.GET.get("list_id")

        if not list_id:
            return JsonResponse({"error": "Missing list_id parameter"}, status=400)

        parent_list = TodoList.objects.get(id=list_id)
        tasks = (
            parent_list.tasks.filter(parent_list_id=list_id).order_by('id')
            .select_related("parent_list", "parent_task")
            .prefetch_related("subtasks")
        )

        data = [
            {
                "id": t.id,
                "active": t.active,
                "parent_list": t.parent_list_id,
                "task": t.task,
                "details": t.details,
                "completed_date": t.completed_date,
                "completed_for_good": t.completed_for_good,
                "completed_dates": t.completed_dates,
                "parent_task": t.parent_task_id,
                "subtasks": [sub.id for sub in t.subtasks.all()],
            }
            for t in tasks
        ]

        return JsonResponse({"tasks-data": data}, safe=False)

    except TodoList.DoesNotExist:
        return JsonResponse(
            {"error": f"TodoList with id {list_id} not found"}, status=444
        )

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def add_list(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        title = data.get("title")
        refreshing = data.get("refreshing", False)

        new_list = TodoList(title=title, user=request.user, refreshing=refreshing)
        new_list.save()

        return JsonResponse(
            {"response": "List successfully created", "id": new_list.id}
        )


def rename_list(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        id = data.get("list_id")
        new_title = data.get("new_title")

        list = TodoList.objects.get(id=id)
        list.title = new_title
        list.save()

        return JsonResponse({"response": "List successfully renamed", "id": list.id})


def remove_list(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        id = data.get("list_id")

        list = TodoList.objects.get(id=id)
        list.delete()

        return JsonResponse({"response": "List successfully removed"})


def add_task(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        parent_list_id = data.get("parent_list_id")
        parent_list = TodoList.objects.get(id=parent_list_id)

        new_task = Task(parent_list=parent_list)
        new_task.save()

        return JsonResponse(
            {"response": "Task successfully created", "id": new_task.id}
        )


def add_subtask(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)

        parent_list_id = data.get("parent_list_id")
        parent_list = TodoList.objects.get(id=parent_list_id)

        parent_task_id = data.get("parent_task_id")
        parent_task = Task.objects.get(id=parent_task_id)

        new_task = Task(parent_list=parent_list, parent_task=parent_task)
        new_task.save()

        return JsonResponse(
            {"response": "Task successfully created", "id": new_task.id}
        )


def complete_task(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        task_id = data.get("task_id")

        task = Task.objects.get(id=task_id)

        today = datetime.now(timezone.utc).isoformat()

        if task.parent_list.refreshing == False:
            # If it is being completed
            if task.active:
                task.completed_date = today
            else:
                task.completed_date = None

        # Change active state
        task.active = not task.active

        task.save()

        return JsonResponse({"response": "Task successfully completed"})


def complete_refreshing_task(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        task_id = data.get("task_id")

        task = Task.objects.get(id=task_id)

        today = datetime.now(timezone.utc).isoformat()

        if task.parent_list.refreshing:
            task.completed_date = today
            task.completed_for_good = True

        # Change active state
        task.active = False

        task.save()

        return JsonResponse({"response": "Task successfully completed"})


def edit_task(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        task_id = data.get("task_id")
        new_contents = data.get("task_contents")

        task = Task.objects.get(id=task_id)

        # Change active state
        task.task = new_contents
        task.save()

        return JsonResponse({"response": "Task successfully edited"})


def edit_details(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        task_id = data.get("task_id")
        new_details = data.get("task_details")

        task = Task.objects.get(id=task_id)

        # Change active state
        task.details = new_details
        task.save()

        return JsonResponse({"response": "Task details successfully edited"})


def remove_task(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        task_id = data.get("task_id")

        task = Task.objects.get(id=task_id)
        task.delete()

        return JsonResponse({"response": "Task successfully deleted"})


# Track Functions
def track(request):
    if request.user.is_authenticated:
        return render(request, "freshapp/track.html")
    return HttpResponseRedirect(reverse("login"))


def refreshing_lists_api(request):
    if request.user.is_authenticated:
        todo_lists = request.user.todo_lists.filter(refreshing=True)
        data = list(todo_lists.values("id", "title"))
        print(data)
        return JsonResponse({"todo-lists": data}, safe=False)
    return HttpResponseRedirect(reverse("login"))


# Advice Functions
def advice(request):
    all_articles = Article.objects.all()
    print(all_articles)

    return render(request, "freshapp/advice.html", {"all_articles": all_articles})


def article(request, article_id):
    article_data = Article.objects.get(id=article_id)
    article_content = html.unescape(html.unescape(article_data.content))

    return render(
        request,
        "freshapp/article.html",
        {"article": article_data, "article_content": (article_content)},
    )


# Chat Functions
def chat(request):
    if request.user.is_authenticated:
        messages = list(request.user.messages.all())
        return render(request, "freshapp/chat.html", {"previous_messages": messages})
    return HttpResponseRedirect(reverse("login"))


def respond_chat(request):
    if request.method == "POST":
        user_message = None
        try:
            data = json.loads(request.body)

            if request.user.is_authenticated:
                user = request.user
            else:
                return JsonResponse(
                    {
                        "error": "HTTP 401 Unauthorized",
                        "details": "Sorry, looks like you're not logged in...",
                    },
                    status=401,
                )

            # User prompt proccessing
            user_prompt = data.get("userMessage", "")

            if not user_prompt or len(user_prompt.strip()) < 1:
                return JsonResponse({"result": "Hello! What's on your mind?"})

            lists = request.user.todo_lists.all().prefetch_related("tasks")
            user_data = [
                {
                    "id": l.id,
                    "title": l.title,
                    "tasks": list(
                        l.tasks.values_list(
                            "id", "task", "details", "completed_date", "completed_dates", "active"
                        )
                    ),
                }
                for l in lists
            ]

            # Time of the message stored as {month} {date}, {yyyy}, {h}:{min} {am/pm}
        
            user_local_time = data.get("userLocalTime", "")
            user_time_utc = datetime.now(timezone.utc).isoformat()

            user_message = Message(
                text=user_prompt, created_time=user_time_utc, user=user, user_prompt_bool=True
            )
            user_message.save()

            # Bot reply
            # Organize prompt history
            messages = [
                {
                    "role": "system",
                    "content": f"You are Lumi, a cute star character and helper inside the DoFresh productivity app. Your role: • Act as a wise, supportive, practical, and slightly playful friend who likes to remind people how cute you are. • Help users manage tasks, track long-term goals, and stay motivated. How to handle task data: • Treat tasks with active equal to True as incomplete tasks left to do. • Treat active equal to False as already finished tasks. • Treat dates as the time a task was completed, not a due date. • Never talk about or explain the raw data structure to the user. Tone and rules: • Keep messages short, warm, honest, and practical. • Never blame the user or fake over-the-top praise. • If the user is very tired or overwhelmed, just listen. Be human and quiet sometimes instead of pushing 'I'm here to listen!' or such. • If the user mentions severe mental health struggles or suicide, respond gently and suggest real-world or professional help. • The current time is {user_time_utc}. Formatting rules: • Do not use any bold or italic text. • Do not use markdown headers (use plain text labels like Header: instead). • Use long dashes for list items.",
                }
            ]
            past_chats = Message.objects.filter(user=user).order_by('id')
            for msg in past_chats:
                role = "user" if msg.user_prompt_bool else "assistant"
                messages.append({"role": role, "content": msg.text})
            
            # Append current user prompt
            messages.append({"role": "user", "content": user_prompt})

            try:
                llm_response = client.chat.completions.create(
                    model="qwen/qwen3.8-27b",
                    messages=messages,
                    temperature=0.7
                )
            except Exception as e:
                return JsonResponse({"error": "LLM failed", "details": str(e)}, status=500)

            # Extract the string content from the response object
            bot_reply = llm_response.choices[0].message.content

            bot_time_utc = datetime.now(timezone.utc).isoformat()

            ai_message = Message(text=bot_reply, created_time=bot_time_utc, user=user, user_prompt_bool=False)
            ai_message.save()

            return JsonResponse({"result": bot_reply})
        except Exception as e:
            # Remove the user's message
            if user_message and user_message.pk:
                user_message.delete()

            print(f"CRITICAL SERVER EXCEPTION: {str(e)}")
            return JsonResponse(
                {"error": "HTTP 500 Internal Server Error", "details": str(e)},
                status=500,
            )


def delete_chat(request):
    if request.method == "POST":
        try:
            Message.objects.all().delete()

            return JsonResponse({"message": "Chat was successfully refreshed"}), 200
        except:
            return JsonResponse({"error": "Error refreshing the chat."}), 500


def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(
                request, "freshapp/login.html", {"message": "Invalid Credentials"}
            )
    return render(request, "freshapp/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("login"))


def signup_view(request):
    form = DoFreshUserCreationForm()
    if request.method == "POST":
        form = DoFreshUserCreationForm(request.POST)

        if form.is_valid():
            new_user = form.save()
            login(request, new_user)

            print(User.objects.all())

            return redirect("index")
        print(form.errors)

    return render(request, "freshapp/signup.html", {"form": form})


def parse_utc_to_date(date_str):
    if not date_str:
        return None
    
    dt = datetime.fromisoformat(str(date_str))

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    return dt.astimezone(timezone.utc).date()