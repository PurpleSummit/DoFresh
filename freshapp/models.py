from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):
    last_accessed_date = models.CharField(max_length=128, blank=True, null=True, default="")

    def __str__(self):
        return f"{self.username}"


class Message(models.Model):
    text = models.TextField()
    created_time = models.CharField(max_length=128)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messages"
    )
    user_prompt_bool = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user} response message: {self.id}"


class TodoList(models.Model):
    title = models.TextField()
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="todo_lists", null=True, blank=True
    )
    refreshing = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user} list: {self.title}"


class Task(models.Model):
    TASK_TYPES = [
        ("standard", "Standard Task"),
        ("refreshing", "Refreshing Task"),
    ]

    active = models.BooleanField(default=True)
    task = models.CharField(default="", max_length=512, blank=True)
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


class Article(models.Model):
    title = models.CharField(max_length=128)
    content = models.TextField()
    subtitle = models.TextField()
    # photo = models.ImageField(upload_to='products/', blank=True, null=True) <- need a cloud service!!
    # category = models.ForeignKey(ArticleCategory, on_delete=models.CASCADE, related_name="articles", null=True, blank=True)
