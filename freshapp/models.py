from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class User(AbstractUser):
    pass


class Message(models.Model):
    text = models.CharField(max_length=10000)
    created_time = models.CharField(max_length=128)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages", null=True, blank=True)
