from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'is_verified', 'subscription_tier', 'credits_remaining']
    list_filter = ['is_verified', 'subscription_tier']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('is_verified', 'subscription_tier', 'credits_remaining')}),
    )
