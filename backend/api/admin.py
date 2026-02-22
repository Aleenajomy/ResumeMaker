from django.contrib import admin
from .models import (
    Resume,
    JobDescription,
    OptimizedResume,
    CoverLetter,
    Job,
    GeneratedDocument,
)

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'has_original_file', 'has_latex_file', 'created_at']
    list_filter = ['created_at']

    def has_original_file(self, obj):
        return bool(obj.original_file)

    has_original_file.boolean = True
    has_original_file.short_description = 'Original File'

    def has_latex_file(self, obj):
        return bool(obj.latex_file)

    has_latex_file.boolean = True
    has_latex_file.short_description = 'LaTeX File'

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


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'company_name', 'job_title', 'created_at']
    list_filter = ['created_at']
    search_fields = ['company_name', 'job_title', 'user__username']


@admin.register(GeneratedDocument)
class GeneratedDocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'job', 'ats_score', 'is_latex_based', 'created_at']
    list_filter = ['created_at']
    search_fields = ['job__company_name', 'job__job_title', 'user__username']
