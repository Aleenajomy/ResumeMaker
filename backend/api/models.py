from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator

class Resume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    original_file = models.FileField(
        upload_to='resumes/original/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'docx', 'txt'])],
        null=True,
        blank=True,
    )
    latex_file = models.FileField(
        upload_to='resumes/latex/',
        validators=[FileExtensionValidator(allowed_extensions=['tex'])],
        null=True,
        blank=True,
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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='job_descriptions')
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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='optimized_resumes')
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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cover_letters')
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


class Job(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='jobs')
    source_resume = models.ForeignKey(
        Resume,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='jobs',
    )
    company_name = models.CharField(max_length=255)
    job_title = models.CharField(max_length=255)
    job_description = models.TextField()
    requirements = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.job_title} at {self.company_name} - {self.user.username}"


class GeneratedDocument(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='generated_documents')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='generated_documents')
    source_resume = models.ForeignKey(
        Resume,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_documents',
    )
    tailored_resume_text = models.TextField()
    cover_letter_text = models.TextField()
    email_subject = models.CharField(max_length=255)
    email_body = models.TextField()
    ats_score = models.IntegerField(null=True, blank=True)
    matched_keywords = models.JSONField(default=list, blank=True)
    missing_keywords = models.JSONField(default=list, blank=True)
    resume_pdf = models.FileField(upload_to='generated/resumes/', null=True, blank=True)
    tailored_resume_tex = models.FileField(upload_to='generated/latex/', null=True, blank=True)
    is_latex_based = models.BooleanField(default=False)
    cover_letter_pdf = models.FileField(upload_to='generated/cover_letters/', null=True, blank=True)
    diff_json = models.JSONField(null=True, blank=True)
    ai_changes = models.JSONField(default=list, blank=True)
    token_usage = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['ats_score']),
        ]

    def __str__(self):
        return f"GeneratedDocument {self.id} - {self.job.job_title} - {self.user.username}"
