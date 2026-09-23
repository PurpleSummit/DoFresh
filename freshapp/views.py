from django.shortcuts import render
from django.http import JsonResponse, HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout

from freshapp.models import *

# Create your views here.
import os, json
from datetime import datetime
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

API_KEY = os.getenv("HUGGINGFACE_API_KEY")

client = InferenceClient(api_key=API_KEY)

# Index Page Functions
def index(request):
    if request.user.is_authenticated:
        return render(request, "freshapp/index.html")
    return HttpResponseRedirect(reverse("login"))


def lists_api(request):
    if request.user.is_authenticated:
        todo_lists = request.user.todo_lists.all()
        data = list(todo_lists.values('id', 'title', 'refreshing'))
        print(data)
        return JsonResponse({"todo-lists": data}, safe=False)


def tasks_api(request):
    try:
        list_id = request.GET.get('list_id')

        if not list_id:
            return JsonResponse({'error': 'Missing list_id parameter'}, status=400)

        parent_list = TodoList.objects.get(id=list_id)
        print(parent_list)
        tasks = parent_list.tasks.all()
        print(tasks)

        data = list(tasks.values('id', 'active', 'task', 'details', 'completed_date', 'completed_for_good', 'completed_dates', 'parent_task'))
        
        return JsonResponse({"tasks-data": data}, safe=False)

    except TodoList.DoesNotExist:
        return JsonResponse({'error': f"TodoList with id {list_id} not found"}, status=444)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def add_task(request):
    if request.method == "POST":
        ...

# Track Functions
def track(request):
    if request.user.is_authenticated:
        return render(request, "freshapp/track.html")
    return HttpResponseRedirect(reverse("login"))


def advice(request):
    return render(request, "freshapp/advice.html")

# Chat Functions
def chat(request):
    if request.user.is_authenticated:
        user_messages = list(request.user.sent_messages.all())
        ai_messages = list(request.user.ai_messages.all())
        return render(
            request, "freshapp/chat.html", {"previous_messages": user_messages}
        )
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
            user_time = f"{user_time.strftime('%b')} {user_time.strftime('%d')}, {user_time.strftime('%Y')}, {user_time.strftime('%I')}:{user_time.strftime('%M')} {user_time.strftime('%p')}"

            user_message = Message(
                author=user, text=user_prompt, created_time=user_time
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
            bot_time = f"{bot_time.strftime('%b')} {bot_time.strftime('%d')}, {bot_time.strftime('%Y')}, {bot_time.strftime('%I')}:{bot_time.strftime('%M')} {bot_time.strftime('%p')}"

            ai_message = Message(text=bot_reply, created_time=bot_time)
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

        new_user = User.objects.create_user(
            username=username,
            password=password
        )

        new_user.save()

        login_view(request)
        return HttpResponseRedirect(reverse("index"))
    return render(request, "freshapp/signup.html")
