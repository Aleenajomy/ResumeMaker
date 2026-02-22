from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Resume, JobDescription, OptimizedResume, CoverLetter

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
        fields = ['id', 'original_file', 'parsed_content', 'created_at', 'updated_at']
        read_only_fields = ['parsed_content', 'created_at', 'updated_at']

    def validate_original_file(self, value):
        if value.size > 10 * 1024 * 1024:  # 10MB
            raise serializers.ValidationError("File size cannot exceed 10MB")
        return value

class ResumeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'created_at', 'updated_at']

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
