from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/track")
def track():
    return render_template("track.html")

@app.route("/advice")
def advice():
    return render_template("advice.html")