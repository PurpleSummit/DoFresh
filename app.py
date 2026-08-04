import os
import requests
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("HUGGINGFACE_API_KEY")
# API_URL = "https://huggingface.co"

client = InferenceClient(api_key=API_KEY)

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
    return render_template("chat.html")


@app.route("/api/respond-chat", methods=["POST"])
def respond_chat():
    try: 
        data = request.json
        user_message = data.get("userMessage", "")

        response = client.chat_completion(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=[{"role": "user", "content": user_message}],
            max_tokens=500
        )

        bot_reply = response.choices[0].message.content
        return jsonify({"result": bot_reply})
    except Exception as e:
        print(f"CRITICAL SERVER EXCEPTION: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
