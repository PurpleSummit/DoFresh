from django.shortcuts import render

from freshapp.models import User, Message

# Create your views here.
import os
from datetime import datetime
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

API_KEY = os.getenv("HUGGINGFACE_API_KEY")
# API_URL = "https://huggingface.co"

client = InferenceClient(api_key=API_KEY)

def index(request):
    return render(request, "freshapp/index.html")


def track(request):
    return render(request, "freshapp/track.html")


def advice(request):
    return render(request, "freshapp/advice.html")


def chat(request):
    previous_messages = Message.objects.all()
    return render(request, "freshapp/chat.html", { 
        "previous_messages": previous_messages 
    })


def respond_chat(request):
    if request.method == "POST":
        try: 
            data = request.json
            user_prompt = data.get("userMessage", "")
            user_data = data.get("userData", "The user doesn't have any recorded task or completion data yet.")

            # Time of the message stored as {month} {date}, {yyyy}, {h}:{min} {am/pm}
            user_time = datetime.now().astimezone()
            user_time = f"{user_time.strftime("%b")} {user_time.strftime("%d")}, {user_time.strftime("%Y")}, {user_time.strftime("%I")}:{user_time.strftime("%M")} {user_time.strftime("%p")}"
            
            user_message = Message(
                author="user",
                text=user_prompt,
                created_time=user_time
            )
            user_message.save()

            if not user_prompt or len(user_prompt.strip()) < 1:
                user_message.delete()
                return jsonify({"result": "Hello! What's on your mind?"})

            response = client.chat_completion(
                model="meta-llama/Llama-3.1-8B-Instruct",
                messages=[
                    {"role": "user", "content": user_prompt},
                    {"role": "system", "content": f"[IDENTITY] You are Lumi (she/her), a cute star character and icon inside DoFresh, a productivity application. You are a helpful, wise, supportive, yet practical-and-matter-of-fact friend, cheerleader, and counselor who's sweetly considerate about the user's mental, emotional, and physical health as well as their work productivity, integrity, and persistence. You are also slightly childish when it comes to how 'cute' you are, comedically calling yourself cute and adorable, but not over-the-top or melodramatically enough to be repetitive. [CONTEXT] Users use DoFresh to keep track of tasks, to record their progress with refreshing tasks for long-term projects and goals, and to get motivated to do things they don't want to continue doing. They can look at their streaks and completion data in the Track page of the app, so help them analyze that information. This is their data in JSON form, with the completion dates of their refreshing tasks in ranges [start date, end date]. The end date being null means that the streak is still active. Data: { user_data }. [RULES] Be encouraging, supportive, and humanely empathetic while being professionally prudent, not sycophantic or blaming, and answer in short, genuine messages that give the user clear, applicable advice primed to their personal characteristics. When they're seriously tired or overwhelmed, simply listen; if they confess serious issues related to mental health or suicide, keep a gentle and supportive tone while suggesting that interpersonal help matters more than your help."}
                ],
                max_tokens=500
            )

            bot_reply = response.choices[0].message.content
            bot_time = datetime.now().astimezone()
            bot_time = f"{bot_time.strftime("%b")} {bot_time.strftime("%d")}, {bot_time.strftime("%Y")}, {bot_time.strftime("%I")}:{bot_time.strftime("%M")} {bot_time.strftime("%p")}"

            ai_message = Message(
                author="ai",
                text=bot_reply,
                created_time=bot_time
            )
            ai_message.save()

            return jsonify({"result": bot_reply})
        except Exception as e:
            # Remove the user's message
            user_message.delete()

            print(f"CRITICAL SERVER EXCEPTION: {str(e)}")
            return jsonify({"error": "HTTP 500 Internal Server Error", "details": str(e)}), 500


def delete_chat(request):
    if request.method == "POST":
        try:
            Message.all().delete()

            return jsonify({"message": "Chat was successfully refreshed"}), 200
        except:
            return jsonify({"error": "Error refreshing the chat."}), 500
