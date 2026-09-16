from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("track/", views.track, name="track"),
    path("advice/", views.advice, name="advice"),
    path("chat/", views.chat, name="chat"),
    path("respond_chat/", views.chat, name="api_chat")
]