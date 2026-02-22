from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResumeViewSet,
    JobDescriptionViewSet,
    OptimizedResumeViewSet,
    CoverLetterViewSet,
    UserRegistrationViewSet
)

router = DefaultRouter()
router.register(r'resumes', ResumeViewSet, basename='resume')
router.register(r'job-descriptions', JobDescriptionViewSet, basename='job-description')
router.register(r'optimized-resumes', OptimizedResumeViewSet, basename='optimized-resume')
router.register(r'cover-letters', CoverLetterViewSet, basename='cover-letter')
router.register(r'auth', UserRegistrationViewSet, basename='auth')

urlpatterns = [
    path('', include(router.urls)),
]
