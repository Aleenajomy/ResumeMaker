from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'phone', 'location', 'created_at']
    search_fields = ['full_name', 'user__username', 'user__email']
    list_filter = ['created_at']
