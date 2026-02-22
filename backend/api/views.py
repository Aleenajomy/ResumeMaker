from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.files.base import ContentFile
from django.contrib.auth.models import User
from .models import Resume, JobDescription, OptimizedResume, CoverLetter
from .serializers import (
    ResumeSerializer, ResumeListSerializer,
    JobDescriptionSerializer, JobDescriptionListSerializer,
    OptimizedResumeSerializer, OptimizedResumeListSerializer,
    CoverLetterSerializer, CoverLetterListSerializer,
    UserRegistrationSerializer
)
from .pdf_service import PDFService
from .ai_service import AIService
import logging

logger = logging.getLogger(__name__)


class UserRegistrationViewSet(viewsets.GenericViewSet):
    """User registration endpoint"""
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {'message': 'User created successfully', 'user_id': user.id},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return ResumeListSerializer
        return ResumeSerializer

    def perform_create(self, serializer):
        file = self.request.FILES.get('original_file')
        
        if not file:
            raise ValueError("No file provided")
        
        try:
            # Extract text from file
            text = PDFService.extract_text(file)
            
            # Parse resume with AI
            parsed_content = AIService.parse_resume(text)
            
            # Save resume
            serializer.save(user=self.request.user, parsed_content=parsed_content)
            
        except ValueError as e:
            logger.error(f"Validation error in resume upload: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error processing resume: {str(e)}")
            raise Exception(f"Failed to process resume: {str(e)}")

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Failed to process resume. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class JobDescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = JobDescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobDescription.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return JobDescriptionListSerializer
        return JobDescriptionSerializer

    def perform_create(self, serializer):
        content = self.request.data.get('content', '')
        file = self.request.FILES.get('file')
        
        try:
            # Extract content from file if provided
            if file:
                content = PDFService.extract_text(file)
            
            if not content or len(content.strip()) < 50:
                raise ValueError("Job description must be at least 50 characters")
            
            # Extract keywords with AI
            extracted_keywords = AIService.extract_keywords(content)
            
            # Save job description
            serializer.save(
                user=self.request.user,
                content=content,
                extracted_keywords=extracted_keywords
            )
            
        except ValueError as e:
            logger.error(f"Validation error in job description: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error processing job description: {str(e)}")
            raise Exception(f"Failed to process job description: {str(e)}")

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Failed to process job description. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OptimizedResumeViewSet(viewsets.ModelViewSet):
    serializer_class = OptimizedResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OptimizedResume.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return OptimizedResumeListSerializer
        return OptimizedResumeSerializer

    def create(self, request):
        resume_id = request.data.get('resume_id')
        jd_id = request.data.get('job_description_id')

        # Validate input
        if not resume_id or not jd_id:
            return Response(
                {'error': 'Both resume_id and job_description_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get resume and job description
            resume = Resume.objects.get(id=resume_id, user=request.user)
            jd = JobDescription.objects.get(id=jd_id, user=request.user)
            
            # Validate parsed content exists
            if not resume.parsed_content:
                return Response(
                    {'error': 'Resume has not been parsed yet'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not jd.extracted_keywords:
                return Response(
                    {'error': 'Job description keywords have not been extracted yet'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Resume.DoesNotExist:
            return Response(
                {'error': 'Resume not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except JobDescription.DoesNotExist:
            return Response(
                {'error': 'Job description not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Calculate ATS score
            score_data = AIService.calculate_ats_score(
                resume.parsed_content,
                jd.extracted_keywords
            )
            
            # Optimize resume with AI
            optimized_content = AIService.optimize_resume(
                resume.parsed_content,
                jd.content
            )
            
            # Generate PDF
            pdf_file = PDFService.generate_resume_pdf(optimized_content)
            
            # Create optimized resume
            optimized_resume = OptimizedResume.objects.create(
                user=request.user,
                original_resume=resume,
                job_description=jd,
                optimized_content=optimized_content,
                ats_score=score_data['score'],
                matched_keywords=score_data['matched'],
                missing_keywords=score_data['missing']
            )
            
            # Save PDF file
            optimized_resume.pdf_file.save(
                f'resume_{optimized_resume.id}.pdf',
                ContentFile(pdf_file.read())
            )
            
            serializer = self.get_serializer(optimized_resume)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            logger.error(f"Validation error optimizing resume: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error optimizing resume: {str(e)}")
            return Response(
                {'error': 'Failed to optimize resume. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CoverLetterViewSet(viewsets.ModelViewSet):
    serializer_class = CoverLetterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CoverLetter.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return CoverLetterListSerializer
        return CoverLetterSerializer

    def create(self, request):
        optimized_resume_id = request.data.get('optimized_resume_id')

        # Validate input
        if not optimized_resume_id:
            return Response(
                {'error': 'optimized_resume_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get optimized resume
            optimized_resume = OptimizedResume.objects.get(
                id=optimized_resume_id,
                user=request.user
            )
            
            # Validate optimized content exists
            if not optimized_resume.optimized_content:
                return Response(
                    {'error': 'Optimized resume content not available'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except OptimizedResume.DoesNotExist:
            return Response(
                {'error': 'Optimized resume not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Generate cover letter with AI
            content = AIService.generate_cover_letter(
                optimized_resume.optimized_content,
                optimized_resume.job_description.content,
                optimized_resume.job_description.title
            )
            
            # Generate PDF
            pdf_file = PDFService.generate_cover_letter_pdf(
                content,
                optimized_resume.optimized_content.get('name', 'Your Name')
            )
            
            # Create cover letter
            cover_letter = CoverLetter.objects.create(
                user=request.user,
                optimized_resume=optimized_resume,
                content=content
            )
            
            # Save PDF file
            cover_letter.pdf_file.save(
                f'cover_letter_{cover_letter.id}.pdf',
                ContentFile(pdf_file.read())
            )
            
            serializer = self.get_serializer(cover_letter)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            logger.error(f"Validation error generating cover letter: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error generating cover letter: {str(e)}")
            return Response(
                {'error': 'Failed to generate cover letter. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
