from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator

class Resume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    original_file = models.FileField(
        upload_to='resumes/original/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'docx', 'txt'])]
    )
    parsed_content = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"Resume {self.id} - {self.user.username}"

class JobDescription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_descriptions')
    title = models.CharField(max_length=255)
    content = models.TextField()
    file = models.FileField(
        upload_to='job_descriptions/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'docx', 'txt'])]
    )
    extracted_keywords = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.username}"

class OptimizedResume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='optimized_resumes')
    original_resume = models.ForeignKey(Resume, on_delete=models.CASCADE)
    job_description = models.ForeignKey(JobDescription, on_delete=models.CASCADE)
    optimized_content = models.JSONField(null=True, blank=True)
    ats_score = models.FloatField()
    matched_keywords = models.JSONField(default=list)
    missing_keywords = models.JSONField(default=list)
    pdf_file = models.FileField(upload_to='resumes/optimized/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['ats_score']),
        ]

    def __str__(self):
        return f"Optimized Resume {self.id} - Score: {self.ats_score}%"

class CoverLetter(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cover_letters')
    optimized_resume = models.ForeignKey(OptimizedResume, on_delete=models.CASCADE)
    content = models.TextField()
    pdf_file = models.FileField(upload_to='cover_letters/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"Cover Letter {self.id} - {self.user.username}"
