from django.contrib import admin
from .models import Certification

@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'issuer', 'user', 'issue_date', 'created_at']
    search_fields = ['title', 'issuer', 'user__username']
    list_filter = ['issue_date', 'created_at']
