from rest_framework import serializers
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'full_name', 'email', 'phone', 'location', 'linkedin_url', 
                  'github_url', 'portfolio_url', 'summary', 'skills', 
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_skills(self, value):
        if isinstance(value, str):
            return [s.strip() for s in value.split(',') if s.strip()]
        return value
