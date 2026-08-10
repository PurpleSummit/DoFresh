import os
import requests
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String, delete

from datetime import datetime

from flask_cors import CORS
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
db.init_app(app)
CORS(app)

API_KEY = os.getenv("HUGGINGFACE_API_KEY")
# API_URL = "https://huggingface.co"

client = InferenceClient(api_key=API_KEY)

class Message(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    author: Mapped[str]
    text: Mapped[str]
    created_time: Mapped[str]

with app.app_context():
    db.create_all()

@app.route("/", methods=["GET", "POST"])
def index():
    return render_template("index.html")


@app.route("/track", methods=["GET"])
def track():
    return render_template("track.html")


@app.route("/advice", methods=["GET"])
def advice():
    return render_template("advice.html")


@app.route("/chat", methods=["GET"])
def chat():
    previous_messages = db.session.scalars(db.select(Message).order_by(Message.created_time)).all()
    return render_template("chat.html", previous_messages=previous_messages)


@app.route("/api/respond-chat", methods=["POST"])
def respond_chat():
    try: 
        data = request.json
        user_prompt = data.get("userMessage", "")

        # Time of the message stored as {month} {date}, {yyyy}, {h}:{min} {am/pm}
        user_time = datetime.now().astimezone()
        user_time = f"{user_time.strftime("%b")} {user_time.strftime("%d")}, {user_time.strftime("%Y")}, {user_time.strftime("%I")}:{user_time.strftime("%M")} {user_time.strftime("%p")}"
        
        user_message = Message(
            author="user",
            text=user_prompt,
            created_time=user_time
        )
        db.session.add(user_message)
        db.session.commit()

        if not user_prompt or len(user_prompt.strip()) < 1:
            db.session.delete(user_message)
            db.session.commit()
            return jsonify({"result": "Hello! What's on your mind?"})

        response = client.chat_completion(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=[
                {"role": "user", "content": user_prompt},
                {"role": "system", "content": "You are a helpful, wise, supportive, yet practical-and-matter-of-fact friend and counselor who's considerately blunt and pragmatic about the user's mental, emotional, and physical health as well as their work productivity, integrity, and persistence. Be encouraging, supportive, and humanely empathetic while being professionally prudent, not sycophantic or blaming, and answer in short, genuine messages that give the user clear, applicable advice primed to their personal characteristics."}
            ],
            max_tokens=500
        )

        bot_reply = response.choices[0].message.content

        ai_message = Message(
            author="ai",
            text=bot_reply,
            created_time=datetime.now().astimezone().isoformat()
        )
        db.session.add(ai_message)
        db.session.commit()

        return jsonify({"result": bot_reply})
    except Exception as e:
        # Remove the user's message
        db.session.delete(user_message)
        db.session.commit()

        print(f"CRITICAL SERVER EXCEPTION: {str(e)}")
        return jsonify({"error": "HTTP 500 Internal Server Error", "details": str(e)}), 500


@app.route("/delete-chat", methods=["POST"])
def delete_chat():
    try:
        num_rows_deleted = db.session.query(Message).delete()
        db.session.commit()

        return jsonify({"message": "Chat was successfully refreshed"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "Error refreshing the chat."}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
