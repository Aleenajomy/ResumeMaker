from rest_framework import serializers
from accounts.models import User
from .models import (
    Resume,
    JobDescription,
    OptimizedResume,
    CoverLetter,
    Job,
    GeneratedDocument,
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords must match"})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'original_file', 'latex_file', 'parsed_content', 'created_at', 'updated_at']
        read_only_fields = ['parsed_content', 'created_at', 'updated_at']

    def validate_original_file(self, value):
        if value and value.size > 10 * 1024 * 1024:  # 10MB
            raise serializers.ValidationError("File size cannot exceed 10MB")
        return value

    def validate_latex_file(self, value):
        if value and value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 10MB")
        return value

    def validate(self, attrs):
        original_file = attrs.get('original_file')
        latex_file = attrs.get('latex_file')

        if self.instance:
            original_file = original_file or getattr(self.instance, 'original_file', None)
            latex_file = latex_file or getattr(self.instance, 'latex_file', None)

        if not original_file and not latex_file:
            raise serializers.ValidationError("Provide at least one resume file (PDF/DOCX/TXT or TEX).")

        return attrs

class ResumeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'original_file', 'latex_file', 'created_at', 'updated_at']

class JobDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'content', 'file', 'extracted_keywords', 'created_at']
        read_only_fields = ['extracted_keywords', 'created_at']

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters")
        return value

    def validate_content(self, value):
        if len(value.strip()) < 50:
            raise serializers.ValidationError("Job description must be at least 50 characters")
        return value

    def validate_file(self, value):
        if value and value.size > 10 * 1024 * 1024:  # 10MB
            raise serializers.ValidationError("File size cannot exceed 10MB")
        return value

class JobDescriptionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'created_at']

class OptimizedResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptimizedResume
        fields = ['id', 'original_resume', 'job_description', 'optimized_content', 
                  'ats_score', 'matched_keywords', 'missing_keywords', 'pdf_file', 'created_at']
        read_only_fields = ['optimized_content', 'ats_score', 'matched_keywords', 
                            'missing_keywords', 'pdf_file', 'created_at']

class OptimizedResumeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptimizedResume
        fields = ['id', 'ats_score', 'created_at']

class CoverLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoverLetter
        fields = ['id', 'optimized_resume', 'content', 'pdf_file', 'created_at']
        read_only_fields = ['content', 'pdf_file', 'created_at']

class CoverLetterListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoverLetter
        fields = ['id', 'created_at']


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'id',
            'source_resume',
            'company_name',
            'job_title',
            'job_description',
            'requirements',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def validate_company_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters")
        return value

    def validate_job_title(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Job title must be at least 2 characters")
        return value

    def validate_job_description(self, value):
        if len(value.strip()) < 50:
            raise serializers.ValidationError("Job description must be at least 50 characters")
        return value


class JobListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['id', 'company_name', 'job_title', 'created_at']


class GeneratedDocumentSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)

    class Meta:
        model = GeneratedDocument
        fields = [
            'id',
            'job',
            'source_resume',
            'tailored_resume_text',
            'cover_letter_text',
            'email_subject',
            'email_body',
            'ats_score',
            'matched_keywords',
            'missing_keywords',
            'resume_pdf',
            'tailored_resume_tex',
            'is_latex_based',
            'cover_letter_pdf',
            'diff_json',
            'ai_changes',
            'token_usage',
            'created_at',
        ]
        read_only_fields = [
            'job',
            'source_resume',
            'tailored_resume_text',
            'cover_letter_text',
            'email_subject',
            'email_body',
            'ats_score',
            'matched_keywords',
            'missing_keywords',
            'resume_pdf',
            'tailored_resume_tex',
            'is_latex_based',
            'cover_letter_pdf',
            'diff_json',
            'ai_changes',
            'token_usage',
            'created_at',
        ]


class GeneratedDocumentListSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.job_title', read_only=True)
    company_name = serializers.CharField(source='job.company_name', read_only=True)

    class Meta:
        model = GeneratedDocument
        fields = ['id', 'job_title', 'company_name', 'ats_score', 'created_at']


class ResumeOptimizerRequestSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField(required=False)
    resume_file = serializers.FileField(required=False, allow_null=True, write_only=True)
    company_name = serializers.CharField(max_length=255)
    job_title = serializers.CharField(max_length=255)
    job_description = serializers.CharField()
    requirements = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_company_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters")
        return value

    def validate_job_title(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Job title must be at least 2 characters")
        return value

    def validate_job_description(self, value):
        if len(value.strip()) < 50:
            raise serializers.ValidationError("Job description must be at least 50 characters")
        return value

    def validate_resume_file(self, value):
        if value and value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Resume file size cannot exceed 10MB")
        if value:
            filename = value.name.lower()
            if not filename.endswith('.tex'):
                raise serializers.ValidationError(
                    "Exact structure mode requires a LaTeX (.tex) resume file."
                )
        return value
