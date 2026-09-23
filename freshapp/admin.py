from django.contrib import admin
from freshapp.models import *

# Register your models here.
admin.site.register(User)
admin.site.register(TodoList)
admin.site.register(Task)
admin.site.register(AIMessage)
admin.site.register(UserMessage)