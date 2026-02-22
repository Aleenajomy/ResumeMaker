from rest_framework import serializers
from .models import Certification

class CertificationSerializer(serializers.ModelSerializer):
    credential_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Certification
        fields = ['id', 'title', 'issuer', 'issue_date', 'expiry_date', 
                  'credential_id', 'credential_url', 'media_file', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
