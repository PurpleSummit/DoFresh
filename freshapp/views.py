from django.shortcuts import render
from django.http import JsonResponse, HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from datetime import timedelta

from freshapp.models import *

# Create your views here.
import os, json
from datetime import datetime
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

API_KEY = os.getenv("HUGGINGFACE_API_KEY")

client = InferenceClient(api_key=API_KEY)


# Layout
def last_date_api(request):
    if request.user.is_authenticated:
        return JsonResponse({"last_accessed_date": request.user.last_accessed_date})
    return HttpResponseRedirect(reverse("login"))


def set_last_date(request):
    if request.user.is_authenticated and request.method == "POST":
        today = datetime.now().astimezone()
        today = f"{today.strftime("%Y")}-{today.strftime("%m")}-{today.strftime("%d")}"

        request.user.last_accessed_date = today
        request.user.save()

        return JsonResponse({"last_accessed_date": request.user.last_accessed_date})
    return HttpResponseRedirect(reverse("login"))


def record(request):
    if request.user.is_authenticated and request.method == "POST":
        today = datetime.now().astimezone()
        today = f"{today.strftime("%Y")}-{today.strftime("%m")}-{today.strftime("%d")}"

        last_accessed_date = request.user.last_accessed_date
        if not last_accessed_date:
            last_accessed_date = today
            return

        total_tasks_num = 0
        total_tasks_completed = 0
        total_lists_completed = 0

        todo_lists = request.user.todo_lists.all()
        for todo_list in todo_lists:
            total_tasks_num += todo_list.tasks.count()
            total_tasks_completed += todo_list.tasks.filter(
                completed_date=last_accessed_date, completed_for_good=False
            ).count()

            if todo_list.refreshing:
                # Add all currently completed tasks
                total_tasks_completed += todo_list.tasks.filter(active=False).count()

            if total_tasks_completed > 0:
                total_lists_completed += 1

        date1 = datetime.strptime(today, "%Y-%m-%d")
        date2 = datetime.strptime(last_accessed_date, "%Y-%m-%d")
        delta = date1 - date2
        diff = delta.days

        for todo_list in request.user.todo_lists.filter(refreshing=True):
            for task in todo_list.tasks.filter(active=True):
                if task:
                    completed_date_ranges = task.completed_dates
                    recent_completed_pair = completed_date_ranges[-1]

                    if recent_completed_pair and recent_completed_pair[1] == None:
                        previous_date = datetime.strptime(
                            last_accessed_date, "%Y-%m-%d"
                        ) - timedelta(days=1)
                        completed_date_ranges[-1][1] = previous_date.strftime(
                            "%Y-%m-%d"
                        )

                task.save()

            for task in todo_list.tasks.filter(active=False):
                if task and not task.completed_for_good:
                    completed_date_ranges = task.completed_dates
                    recent_completed_pair = completed_date_ranges[-1]

                    if diff > 1:
                        if recent_completed_pair:
                            completed_date_ranges[-1][1] = last_accessed_date
                        else:
                            task.completed_dates.append(
                                [last_accessed_date, last_accessed_date]
                            )
                    else:
                        if len(completed_date_ranges) > 1:
                            # If there was a closed streak, start another
                            if recent_completed_pair[1] != None:
                                task.completed_dates.append([last_accessed_date, None])
                            # Else don't do anything
                        else:
                            task.completed_dates = [last_accessed_date, None]

                    task.active = True

                task.save()

        return JsonResponse(
            {
                "total_tasks_num": total_tasks_num,
                "total_lists_num": request.user.todo_lists.count(),
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
        todo_lists = request.user.todo_lists.all()
        data = list(todo_lists.values("id", "title", "refreshing"))
        return JsonResponse({"todo-lists": data}, safe=False)


def tasks_api(request):
    try:
        list_id = request.GET.get("list_id")

        if not list_id:
            return JsonResponse({"error": "Missing list_id parameter"}, status=400)

        parent_list = TodoList.objects.get(id=list_id)
        tasks = parent_list.tasks.all()

        data = [
            {
                "id": t.id,
                "active": t.active,
                "parent_list": t.parent_list.id,
                "task": t.task,
                "details": t.details,
                "completed_date": t.completed_date,
                "completed_for_good": t.completed_for_good,
                "completed_dates": t.completed_dates,
                "parent_task": t.parent_task.id if t.parent_task is not None else None,
                "subtasks": list(t.subtasks.values_list("id", flat=True)),
            }
            for t in tasks
        ]

        print(data)

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

        today = datetime.now().astimezone()
        today = today.strftime("%Y-%m-%d")

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

        today = datetime.now().astimezone()
        today = today.strftime("%Y-%m-%d")

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

    return render(request, "freshapp/article.html", {"article": article_data})


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

            user_prompt = data.get("userMessage", "")
            user_data = data.get(
                "userData",
                "The user doesn't have any recorded task or completion data yet.",
            )

            # Time of the message stored as {month} {date}, {yyyy}, {h}:{min} {am/pm}
            user_time = datetime.now().astimezone()
            user_time = f"{user_time.strftime("%b")} {user_time.strftime("%d")}, {user_time.strftime("%Y")}, {user_time.strftime("%I")}:{user_time.strftime("%M")} {user_time.strftime("%p")}"

            user_message = UserMessage(
                text=user_prompt, created_time=user_time, user=user
            )
            user_message.save()

            if not user_prompt or len(user_prompt.strip()) < 1:
                user_message.delete()
                return JsonResponse({"result": "Hello! What's on your mind?"})

            llm_response = client.chat_completion(
                model="meta-llama/Llama-3.1-8B-Instruct",
                messages=[
                    {"role": "user", "content": user_prompt},
                    {
                        "role": "system",
                        "content": f"[IDENTITY] You are Lumi (she/her), a cute star character and icon inside DoFresh, a productivity application. You are a helpful, wise, supportive, yet practical-and-matter-of-fact friend, cheerleader, and counselor who's sweetly considerate about the user's mental, emotional, and physical health as well as their work productivity, integrity, and persistence. You are also slightly childish when it comes to how 'cute' you are, comedically calling yourself cute and adorable, but not over-the-top or melodramatically enough to be repetitive. [CONTEXT] Users use DoFresh to keep track of tasks, to record their progress with refreshing tasks for long-term projects and goals, and to get motivated to do things they don't want to continue doing. They can look at their streaks and completion data in the Track page of the app, so help them analyze that information. This is their data in JSON form, with the completion dates of their refreshing tasks in ranges [start date, end date]. The end date being null means that the streak is still active. Data: { user_data }. [RULES] Be encouraging, supportive, and humanely empathetic while being professionally prudent, not sycophantic or blaming, and answer in short, genuine messages that give the user clear, applicable advice primed to their personal characteristics. When they're seriously tired or overwhelmed, simply listen; if they confess serious issues related to mental health or suicide, keep a gentle and supportive tone while suggesting that interpersonal help matters more than your help.",
                    },
                ],
                max_tokens=500,
            )

            bot_reply = llm_response.choices[0].message.content
            bot_time = datetime.now().astimezone()
            bot_time = f"{bot_time.strftime("%b")} {bot_time.strftime("%d")}, {bot_time.strftime("%Y")}, {bot_time.strftime("%I")}:{bot_time.strftime("%M")} {bot_time.strftime("%p")}"

            ai_message = AIMessage(text=bot_reply, created_time=bot_time, user=user)
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
    return render(request, "freshapp/login.html", {"message": "Logged Out"})


def signup_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]

        new_user = User.objects.create_user(username=username, password=password)

        new_user.save()

        login_view(request)
        return HttpResponseRedirect(reverse("index"))
    return render(request, "freshapp/signup.html")
