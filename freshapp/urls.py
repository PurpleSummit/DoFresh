from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("track/", views.track, name="track"),
    path("advice/", views.advice, name="advice"),
    path("chat/", views.chat, name="chat"),
    path("api/respond-chat/", views.respond_chat, name="api_chat"),
    path("api/delete-chat/", views.delete_chat, name="delete_chat")
]