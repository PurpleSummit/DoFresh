from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):

    def __str__(self):
        return f"{self.username}"


class Message(models.Model):
    text = models.TextField()
    created_time = models.CharField(max_length=128)


class UserMessage(Message):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )

    def __str__(self):
        return f"{self.user} message: {self.id}"


class AIMessage(Message):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_messages")

    def __str__(self):
        return f"{self.user} response message: {self.id}"


class TodoList(models.Model):
    title = models.TextField()
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="todo_lists", null=True, blank=True
    )
    refreshing = models.BooleanField()

    def __str__(self):
        return f"{self.user} list: {self.title}"


class Task(models.Model):
    TASK_TYPES = [
        ("standard", "Standard Task"),
        ("refreshing", "Refreshing Task"),
    ]

    active = models.BooleanField(default=True)
    task = models.CharField(max_length=512)
    details = models.TextField(blank=True)
    parent_list = models.ForeignKey(
        TodoList, on_delete=models.CASCADE, related_name="tasks"
    )
    completed_date = models.CharField(max_length=128, blank=True, null=True)

    completed_dates = models.JSONField(default=list, blank=True, null=True)
    completed_for_good = models.BooleanField(default=False, blank=True, null=True)

    parent_task = models.ForeignKey(
        'self', on_delete=models.CASCADE, related_name="subtasks", blank=True, null=True
    )
