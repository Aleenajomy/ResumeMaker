import logging

from django.core.files.base import ContentFile
from django.db import transaction
from certifications.models import Certification
from profiles.models import Profile
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .ai_service import AIService
from .models import (
    CoverLetter,
    GeneratedDocument,
    Job,
    JobDescription,
    OptimizedResume,
    Resume,
)
from .pdf_service import PDFService
from .serializers import (
    CoverLetterListSerializer,
    CoverLetterSerializer,
    GeneratedDocumentListSerializer,
    GeneratedDocumentSerializer,
    JobDescriptionListSerializer,
    JobDescriptionSerializer,
    JobListSerializer,
    JobSerializer,
    OptimizedResumeListSerializer,
    OptimizedResumeSerializer,
    ResumeListSerializer,
    ResumeOptimizerRequestSerializer,
    ResumeSerializer,
    UserRegistrationSerializer,
)

logger = logging.getLogger(__name__)


class UserRegistrationViewSet(viewsets.GenericViewSet):
    """User registration endpoint."""

    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {'message': 'User created successfully', 'user_id': user.id},
                status=status.HTTP_201_CREATED,
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
        original_file = self.request.FILES.get('original_file')
        latex_file = self.request.FILES.get('latex_file')
        if not original_file and not latex_file:
            raise ValueError("No file provided")

        parsed_content = {}
        try:
            if original_file:
                resume_text = PDFService.extract_text(original_file)
                if len(resume_text.strip()) >= 50:
                    try:
                        parsed_content = AIService.parse_resume(resume_text)
                    except Exception as exc:
                        logger.warning(f"Resume parsing skipped for original file: {str(exc)}")
            elif latex_file:
                latex_text = PDFService.extract_text(latex_file)
                plain_text = AIService.latex_to_plain_text(latex_text)
                if len(plain_text.strip()) >= 50:
                    try:
                        parsed_content = AIService.parse_resume(plain_text)
                    except Exception as exc:
                        logger.warning(f"Resume parsing skipped for latex file: {str(exc)}")

            if hasattr(original_file, 'seek'):
                original_file.seek(0)
            if hasattr(latex_file, 'seek'):
                latex_file.seek(0)

            serializer.save(user=self.request.user, parsed_content=parsed_content)
        except ValueError as exc:
            logger.error(f"Validation error in resume upload: {str(exc)}")
            raise
        except Exception as exc:
            logger.error(f"Error processing resume: {str(exc)}")
            raise Exception(f"Failed to process resume: {str(exc)}")

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': 'Failed to process resume. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            if file:
                content = PDFService.extract_text(file)

            if not content or len(content.strip()) < 50:
                raise ValueError("Job description must be at least 50 characters")

            extracted_keywords = AIService.extract_keywords(content)
            serializer.save(
                user=self.request.user,
                content=content,
                extracted_keywords=extracted_keywords,
            )
        except ValueError as exc:
            logger.error(f"Validation error in job description: {str(exc)}")
            raise
        except Exception as exc:
            logger.error(f"Error processing job description: {str(exc)}")
            raise Exception(f"Failed to process job description: {str(exc)}")

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': 'Failed to process job description. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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

        if not resume_id or not jd_id:
            return Response(
                {'error': 'Both resume_id and job_description_id are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resume = Resume.objects.get(id=resume_id, user=request.user)
            jd = JobDescription.objects.get(id=jd_id, user=request.user)

            if not resume.parsed_content:
                return Response(
                    {'error': 'Resume has not been parsed yet'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not jd.extracted_keywords:
                return Response(
                    {'error': 'Job description keywords have not been extracted yet'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Resume.DoesNotExist:
            return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)
        except JobDescription.DoesNotExist:
            return Response({'error': 'Job description not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            score_data = AIService.calculate_ats_score(resume.parsed_content, jd.extracted_keywords)
            optimized_content = AIService.optimize_resume(resume.parsed_content, jd.content)
            pdf_file = PDFService.generate_resume_pdf(optimized_content)

            optimized_resume = OptimizedResume.objects.create(
                user=request.user,
                original_resume=resume,
                job_description=jd,
                optimized_content=optimized_content,
                ats_score=score_data['score'],
                matched_keywords=score_data['matched'],
                missing_keywords=score_data['missing'],
            )

            optimized_resume.pdf_file.save(
                f'resume_{optimized_resume.id}.pdf',
                ContentFile(pdf_file.read()),
            )

            serializer = self.get_serializer(optimized_resume)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as exc:
            logger.error(f"Validation error optimizing resume: {str(exc)}")
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.error(f"Error optimizing resume: {str(exc)}")
            return Response(
                {'error': 'Failed to optimize resume. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
        if not optimized_resume_id:
            return Response(
                {'error': 'optimized_resume_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            optimized_resume = OptimizedResume.objects.get(
                id=optimized_resume_id,
                user=request.user,
            )
            if not optimized_resume.optimized_content:
                return Response(
                    {'error': 'Optimized resume content not available'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except OptimizedResume.DoesNotExist:
            return Response({'error': 'Optimized resume not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            content = AIService.generate_cover_letter(
                optimized_resume.optimized_content,
                optimized_resume.job_description.content,
                optimized_resume.job_description.title,
            )
            pdf_file = PDFService.generate_cover_letter_pdf(
                content,
                optimized_resume.optimized_content.get('name', 'Your Name'),
            )

            cover_letter = CoverLetter.objects.create(
                user=request.user,
                optimized_resume=optimized_resume,
                content=content,
            )

            cover_letter.pdf_file.save(
                f'cover_letter_{cover_letter.id}.pdf',
                ContentFile(pdf_file.read()),
            )

            serializer = self.get_serializer(cover_letter)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as exc:
            logger.error(f"Validation error generating cover letter: {str(exc)}")
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.error(f"Error generating cover letter: {str(exc)}")
            return Response(
                {'error': 'Failed to generate cover letter. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class JobViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(user=self.request.user).select_related('source_resume')

    def get_serializer_class(self):
        if self.action == 'list':
            return JobListSerializer
        return JobSerializer


class GeneratedDocumentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GeneratedDocument.objects.filter(user=self.request.user).select_related('job', 'source_resume')

    def get_serializer_class(self):
        if self.action == 'list':
            return GeneratedDocumentListSerializer
        return GeneratedDocumentSerializer


class ResumeOptimizerViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ResumeOptimizerRequestSerializer

    def _extract_resume_source(self, resume):
        if resume.latex_file:
            resume.latex_file.open('rb')
            try:
                latex_text = PDFService.extract_text(resume.latex_file)
            finally:
                resume.latex_file.close()

            plain_text = AIService.latex_to_plain_text(latex_text)
            if not plain_text or len(plain_text.strip()) < 30:
                raise ValueError("LaTeX resume content is too short")

            return {
                'is_latex': True,
                'latex_text': latex_text,
                'plain_text': plain_text,
            }

        if resume.original_file:
            resume.original_file.open('rb')
            try:
                plain_text = PDFService.extract_text(resume.original_file)
            finally:
                resume.original_file.close()

            if not plain_text or len(plain_text.strip()) < 50:
                raise ValueError("Resume content is too short")

            return {
                'is_latex': False,
                'latex_text': None,
                'plain_text': plain_text,
            }

        raise ValueError("Resume file is missing")

    def _create_resume_from_upload(self, user, resume_file):
        if resume_file.size > 10 * 1024 * 1024:
            raise ValueError("Resume file size cannot exceed 10MB")

        filename = resume_file.name.lower()
        if not filename.endswith(('.pdf', '.docx', '.txt', '.tex')):
            raise ValueError("Unsupported file format. Use PDF, DOCX, TXT, or TEX.")

        source_text = PDFService.extract_text(resume_file)
        is_latex = filename.endswith('.tex')
        plain_text = AIService.latex_to_plain_text(source_text) if is_latex else source_text

        parsed_content = {}
        if plain_text and len(plain_text.strip()) >= 50:
            try:
                parsed_content = AIService.parse_resume(plain_text)
            except Exception as exc:
                logger.warning(f"Resume parsing skipped for uploaded file: {str(exc)}")

        if hasattr(resume_file, 'seek'):
            resume_file.seek(0)

        create_kwargs = {
            'user': user,
            'parsed_content': parsed_content,
        }
        if is_latex:
            create_kwargs['latex_file'] = resume_file
        else:
            create_kwargs['original_file'] = resume_file

        resume = Resume.objects.create(**create_kwargs)
        return resume, {
            'is_latex': is_latex,
            'latex_text': source_text if is_latex else None,
            'plain_text': plain_text,
        }

    def _resolve_resume(self, user, request, validated_data):
        resume_file = request.FILES.get('resume_file')
        resume_id = validated_data.get('resume_id')

        if resume_file:
            return self._create_resume_from_upload(user, resume_file)

        if resume_id:
            resume = Resume.objects.get(id=resume_id, user=user)
        else:
            resume = Resume.objects.filter(user=user).order_by('-created_at').first()
            if not resume:
                raise ValueError(
                    "No resume found. Upload one in Dashboard or attach one in the optimizer form."
                )

        source = self._extract_resume_source(resume)
        if not resume.parsed_content and source['plain_text'] and len(source['plain_text'].strip()) >= 50:
            try:
                resume.parsed_content = AIService.parse_resume(source['plain_text'])
                resume.save(update_fields=['parsed_content'])
            except Exception as exc:
                logger.warning(f"Resume parsing skipped while resolving resume: {str(exc)}")

        return resume, source

    def _build_user_profile_payload(self, user):
        profile = Profile.objects.filter(user=user).first()

        return {
            'full_name': getattr(profile, 'full_name', '') or user.get_full_name() or user.username,
            'email': getattr(profile, 'email', '') or user.email,
            'phone': getattr(profile, 'phone', ''),
            'location': getattr(profile, 'location', ''),
            'summary': getattr(profile, 'summary', ''),
            'skills': getattr(profile, 'skills', []) or [],
            'linkedin_url': getattr(profile, 'linkedin_url', ''),
            'github_url': getattr(profile, 'github_url', ''),
            'portfolio_url': getattr(profile, 'portfolio_url', ''),
        }

    def _get_user_certification_payload(self, user):
        certifications = Certification.objects.filter(user=user).order_by('-issue_date', '-created_at')
        return [
            {
                'title': cert.title,
                'issuer': cert.issuer,
            }
            for cert in certifications
        ]

    @action(detail=False, methods=['post'])
    def generate(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        try:
            with transaction.atomic():
                user_model = request.user.__class__
                locked_user = user_model.objects.select_for_update().get(pk=request.user.pk)

                if locked_user.credits_remaining <= 0:
                    raise PermissionError("No credits remaining. Please upgrade or wait for a reset.")

                source_resume, source_resume_data = self._resolve_resume(
                    user=locked_user,
                    request=request,
                    validated_data=validated_data,
                )

                job = Job.objects.create(
                    user=locked_user,
                    source_resume=source_resume,
                    company_name=validated_data['company_name'],
                    job_title=validated_data['job_title'],
                    job_description=validated_data['job_description'],
                    requirements=validated_data.get('requirements', ''),
                )

                user_profile = self._build_user_profile_payload(locked_user)
                generated_payload = AIService.generate_job_documents(
                    user_profile=user_profile,
                    resume_text=source_resume_data['plain_text'],
                    job_data={
                        'company_name': job.company_name,
                        'job_title': job.job_title,
                        'job_description': job.job_description,
                        'requirements': job.requirements,
                    },
                ) if not source_resume_data['is_latex'] else None

                if source_resume_data['is_latex']:
                    latex_payload = AIService.optimize_latex_resume(
                        latex_text=source_resume_data['latex_text'],
                        job_data={
                            'company_name': job.company_name,
                            'job_title': job.job_title,
                            'job_description': job.job_description,
                            'requirements': job.requirements,
                        },
                        user_profile=user_profile,
                    )
                    updated_latex = latex_payload['updated_latex']

                    user_certifications = self._get_user_certification_payload(locked_user)
                    selected_certifications = AIService.select_relevant_certifications(
                        job_description=job.job_description,
                        certifications=user_certifications,
                        max_items=5,
                    )
                    certification_section_content = AIService.build_latex_certifications_section(
                        selected_certifications
                    )
                    if not certification_section_content:
                        certification_section_content = (
                            r'\resumeItemListStart' + "\n"
                            + r'\resumeItem{No certifications added in dashboard}' + "\n"
                            + r'\resumeItemListEnd'
                        )

                    updated_sections = AIService.extract_latex_sections(updated_latex)
                    if 'certifications' in updated_sections:
                        updated_latex = AIService.apply_latex_section_updates(
                            latex_text=updated_latex,
                            section_map=updated_sections,
                            section_updates={'certifications': certification_section_content},
                        )

                    updated_plain_resume = AIService.latex_to_plain_text(updated_latex)
                    application_payload = AIService.generate_application_documents(
                        user_profile=user_profile,
                        tailored_resume_text=updated_plain_resume,
                        job_data={
                            'company_name': job.company_name,
                            'job_title': job.job_title,
                            'job_description': job.job_description,
                            'requirements': job.requirements,
                        },
                    )
                    ats_data = AIService.calculate_ats_score_from_text(
                        job_description=job.job_description,
                        tailored_resume_text=updated_plain_resume,
                    )
                    diff_json = AIService.generate_diff(
                        original_text=source_resume_data['latex_text'],
                        updated_text=updated_latex,
                    )
                    token_usage = {
                        'latex_optimization': latex_payload.get('token_usage'),
                        'application_documents': application_payload.get('token_usage'),
                    }
                    ai_changes = list(latex_payload['changes_made'])
                    if selected_certifications:
                        selected_labels = [cert.get('title', '').strip() for cert in selected_certifications if cert.get('title')]
                        if selected_labels:
                            ai_changes.append(
                                "Selected certifications from dashboard: " + ", ".join(selected_labels)
                            )
                    else:
                        ai_changes.append("No certifications found in dashboard. Inserted placeholder in Certifications section.")

                    generated_document = GeneratedDocument.objects.create(
                        user=locked_user,
                        job=job,
                        source_resume=source_resume,
                        tailored_resume_text=updated_latex,
                        cover_letter_text=application_payload['cover_letter_text'],
                        email_subject=application_payload['email_subject'],
                        email_body=application_payload['email_body'],
                        ats_score=ats_data['score'],
                        matched_keywords=ats_data['matched'],
                        missing_keywords=ats_data['missing'],
                        diff_json=diff_json,
                        ai_changes=ai_changes,
                        token_usage=token_usage,
                        is_latex_based=True,
                    )

                    generated_document.tailored_resume_tex.save(
                        f'tailored_resume_job_{job.id}_{generated_document.id}.tex',
                        ContentFile(updated_latex.encode('utf-8')),
                        save=False,
                    )

                    cover_letter_pdf_buffer = PDFService.generate_text_pdf(
                        title=f"Cover Letter - {job.job_title}",
                        content=application_payload['cover_letter_text'],
                    )
                    generated_document.cover_letter_pdf.save(
                        f'cover_letter_job_{job.id}_{generated_document.id}.pdf',
                        ContentFile(cover_letter_pdf_buffer.read()),
                        save=False,
                    )
                else:
                    ats_data = AIService.calculate_ats_score_from_text(
                        job_description=job.job_description,
                        tailored_resume_text=generated_payload['tailored_resume_text'],
                    )
                    diff_json = AIService.generate_diff(
                        original_text=source_resume_data['plain_text'],
                        updated_text=generated_payload['tailored_resume_text'],
                    )

                    final_ats_score = (
                        ats_data['score']
                        if ats_data['score'] > 0
                        else generated_payload['ats_score']
                    )

                    generated_document = GeneratedDocument.objects.create(
                        user=locked_user,
                        job=job,
                        source_resume=source_resume,
                        tailored_resume_text=generated_payload['tailored_resume_text'],
                        cover_letter_text=generated_payload['cover_letter_text'],
                        email_subject=generated_payload['email_subject'],
                        email_body=generated_payload['email_body'],
                        ats_score=final_ats_score,
                        matched_keywords=ats_data['matched'],
                        missing_keywords=ats_data['missing'],
                        diff_json=diff_json,
                        ai_changes=generated_payload['changes_made'],
                        token_usage=generated_payload.get('token_usage'),
                        is_latex_based=False,
                    )

                    resume_pdf_buffer = PDFService.generate_text_pdf(
                        title=f"Tailored Resume - {job.job_title}",
                        content=generated_payload['tailored_resume_text'],
                    )
                    cover_letter_pdf_buffer = PDFService.generate_text_pdf(
                        title=f"Cover Letter - {job.job_title}",
                        content=generated_payload['cover_letter_text'],
                    )

                    generated_document.resume_pdf.save(
                        f'tailored_resume_job_{job.id}_{generated_document.id}.pdf',
                        ContentFile(resume_pdf_buffer.read()),
                        save=False,
                    )
                    generated_document.cover_letter_pdf.save(
                        f'cover_letter_job_{job.id}_{generated_document.id}.pdf',
                        ContentFile(cover_letter_pdf_buffer.read()),
                        save=False,
                    )
                generated_document.save()

                locked_user.credits_remaining -= 1
                locked_user.save(update_fields=['credits_remaining'])
                request.user.credits_remaining = locked_user.credits_remaining

                response_serializer = GeneratedDocumentSerializer(generated_document)
        except Resume.DoesNotExist:
            return Response({'error': 'Selected resume was not found.'}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_402_PAYMENT_REQUIRED)
        except ValueError as exc:
            logger.error(f"Validation error in optimizer generate: {str(exc)}")
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.error(f"Error in optimizer generate: {str(exc)}")
            return Response(
                {'error': 'Failed to generate job-specific documents. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                'document': response_serializer.data,
                'credits_remaining': request.user.credits_remaining,
            },
            status=status.HTTP_201_CREATED,
        )
