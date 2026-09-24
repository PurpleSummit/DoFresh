from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("signup/", views.signup_view, name="signup"),
    path("", views.index, name="index"),
    path("add-list/", views.add_list, name="add_list"),
    path("rename-list/", views.rename_list, name="rename_list"),
    path("add-task/", views.add_task, name="add_task"),
    path("track/", views.track, name="track"),
    path("advice/", views.advice, name="advice"),
    path("chat/", views.chat, name="chat"),
    path("api/respond-chat/", views.respond_chat, name="api_chat"),
    path("api/delete-chat/", views.delete_chat, name="delete_chat"),
    path("api/get-lists/", views.lists_api, name="lists_api"),
    path("api/get-tasks/", views.tasks_api, name="tasks_api")
]