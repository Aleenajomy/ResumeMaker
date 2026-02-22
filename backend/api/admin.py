from django.contrib import admin
from .models import Resume, JobDescription, OptimizedResume, CoverLetter

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'created_at']
    list_filter = ['created_at']

@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'created_at']
    list_filter = ['created_at']

@admin.register(OptimizedResume)
class OptimizedResumeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'ats_score', 'created_at']
    list_filter = ['created_at']

@admin.register(CoverLetter)
class CoverLetterAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'created_at']
    list_filter = ['created_at']
