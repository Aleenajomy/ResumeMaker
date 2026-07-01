from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResumeViewSet,
    JobDescriptionViewSet,
    UserRegistrationViewSet,
    JobViewSet,
    GeneratedDocumentViewSet,
    ResumeOptimizerViewSet,
)

router = DefaultRouter()
router.register(r'resumes', ResumeViewSet, basename='resume')
router.register(r'job-descriptions', JobDescriptionViewSet, basename='job-description')
router.register(r'auth', UserRegistrationViewSet, basename='auth')
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'generated-documents', GeneratedDocumentViewSet, basename='generated-document')
router.register(r'resume-optimizer', ResumeOptimizerViewSet, basename='resume-optimizer')

urlpatterns = [
    path('', include(router.urls)),
]
