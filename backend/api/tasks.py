from celery import shared_task
from django.core.files.base import ContentFile
from .models import Resume, JobDescription, OptimizedResume, CoverLetter
from .ai_service import AIService, AIServiceProviderError, AIServiceUnavailableError
from .pdf_service import PDFService
import logging
import base64

logger = logging.getLogger(__name__)


def _buffer_to_data_url(buffer, mime_type):
    raw = buffer.read()
    encoded = base64.b64encode(raw).decode('ascii')
    return f"data:{mime_type};base64,{encoded}"


def _text_to_data_url(text, mime_type='text/plain'):
    encoded = base64.b64encode(text.encode('utf-8')).decode('ascii')
    return f"data:{mime_type};charset=utf-8;base64,{encoded}"


@shared_task(bind=True)
def generate_documents_task(self, user_id, resume_id, job_data, user_profile):
    """Async Celery task: full document generation pipeline."""
    from django.contrib.auth import get_user_model
    from django.conf import settings
    from .models import Resume

    try:
        self.update_state(state='PROGRESS', meta={'step': 'Loading resume...'})

        resume = Resume.objects.get(id=resume_id)
        if not resume.latex_file or not resume.latex_file.storage.exists(resume.latex_file.name):
            raise ValueError('Resume file not found on server. Please re-upload.')

        resume.latex_file.open('rb')
        try:
            latex_text = PDFService.extract_text(resume.latex_file)
        finally:
            resume.latex_file.close()

        plain_text = AIService.latex_to_plain_text(latex_text)
        if not plain_text or len(plain_text.strip()) < 30:
            raise ValueError('LaTeX resume content is too short.')

        self.update_state(state='PROGRESS', meta={'step': 'Generating documents with AI...'})

        latex_payload = AIService.generate_latex_all_documents(
            latex_text=latex_text,
            job_data=job_data,
            user_profile=user_profile,
        )

        updated_latex = latex_payload['updated_latex']
        ai_changes = list(latex_payload['changes_made'])

        if AIService.has_latex_template_placeholders(latex_text):
            rendered = AIService.render_latex_template_placeholders(
                latex_text=latex_text,
                headline=latex_payload.get('headline_update', ''),
                summary=latex_payload.get('summary_update', ''),
                skills=latex_payload.get('skills_update', ''),
            )
            if rendered.strip():
                updated_latex = rendered
                ai_changes.append('Rendered LaTeX template placeholders for summary and skills.')

        updated_plain = AIService.latex_to_plain_text(updated_latex)
        ats_data = AIService.calculate_ats_score_from_text(
            job_description=job_data.get('job_description', ''),
            tailored_resume_text=updated_plain,
        )
        diff_json = AIService.generate_diff(
            original_text=latex_text,
            updated_text=updated_latex,
        )

        self.update_state(state='PROGRESS', meta={'step': 'Compiling PDF...'})

        try:
            resume_pdf = _buffer_to_data_url(
                PDFService.compile_latex_to_pdf(updated_latex), 'application/pdf'
            )
        except Exception as exc:
            logger.warning(f'LaTeX PDF compile failed, using fallback: {exc}')
            if getattr(settings, 'LATEX_STRICT_MODE', False):
                raise RuntimeError(f'LaTeX PDF compilation failed: {exc}') from exc
            ai_changes.append('LaTeX PDF compilation failed on server. Generated a fallback text PDF.')
            resume_pdf = _buffer_to_data_url(
                PDFService.generate_text_pdf(title='', content=updated_plain), 'application/pdf'
            )

        try:
            cover_letter_pdf = _buffer_to_data_url(
                PDFService.generate_cover_letter_pdf_via_latex(
                    content=latex_payload['cover_letter_text'], name=''
                ),
                'application/pdf',
            )
        except Exception as exc:
            logger.warning(f'Cover letter LaTeX PDF failed, using fallback: {exc}')
            if getattr(settings, 'LATEX_STRICT_MODE', False):
                raise RuntimeError(f'Cover letter PDF compilation failed: {exc}') from exc
            ai_changes.append('LaTeX cover letter compilation failed on server. Generated a fallback text PDF.')
            cover_letter_pdf = _buffer_to_data_url(
                PDFService.generate_cover_letter_pdf(content=latex_payload['cover_letter_text'], name=''),
                'application/pdf',
            )

        cover_letter_docx = _buffer_to_data_url(
            PDFService.generate_cover_letter_docx(content=latex_payload['cover_letter_text'], name=''),
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )

        return {
            'status': 'success',
            'document': {
                'tailored_resume_text': updated_latex,
                'cover_letter_text': latex_payload['cover_letter_text'],
                'email_subject': latex_payload['email_subject'],
                'email_body': latex_payload['email_body'],
                'ats_score': ats_data['score'],
                'matched_keywords': ats_data['matched'],
                'missing_keywords': ats_data['missing'],
                'resume_pdf': resume_pdf,
                'tailored_resume_tex': _text_to_data_url(updated_latex, 'application/x-tex'),
                'is_latex_based': True,
                'cover_letter_pdf': cover_letter_pdf,
                'cover_letter_docx': cover_letter_docx,
                'diff_json': diff_json,
                'ai_changes': ai_changes,
            },
        }
    except (AIServiceUnavailableError, AIServiceProviderError) as exc:
        return {'status': 'error', 'error': str(exc)}
    except Exception as exc:
        logger.exception(f'generate_documents_task failed: {exc}')
        return {'status': 'error', 'error': str(exc)}


@shared_task
def parse_resume_task(resume_id):
    """Async task to parse resume"""
    try:
        resume = Resume.objects.get(id=resume_id)
        if resume.latex_file:
            text = PDFService.extract_text(resume.latex_file)
            text = AIService.latex_to_plain_text(text)
        elif resume.original_file:
            text = PDFService.extract_text(resume.original_file)
        else:
            raise ValueError("Resume file is missing")

        if not text or len(text.strip()) < 50:
            raise ValueError("Resume content is too short to parse")

        parsed_content = AIService.parse_resume(text)
        resume.parsed_content = parsed_content
        resume.save()
        return {'status': 'success', 'resume_id': resume_id}
    except Exception as e:
        logger.error(f"Error parsing resume {resume_id}: {str(e)}")
        return {'status': 'error', 'message': str(e)}


@shared_task
def extract_keywords_task(jd_id):
    """Async task to extract keywords from job description"""
    try:
        jd = JobDescription.objects.get(id=jd_id)
        extracted_keywords = AIService.extract_keywords(jd.content)
        jd.extracted_keywords = extracted_keywords
        jd.save()
        return {'status': 'success', 'jd_id': jd_id}
    except Exception as e:
        logger.error(f"Error extracting keywords for JD {jd_id}: {str(e)}")
        return {'status': 'error', 'message': str(e)}


@shared_task
def optimize_resume_task(optimized_resume_id):
    """Async task to optimize resume"""
    try:
        optimized_resume = OptimizedResume.objects.get(id=optimized_resume_id)
        resume = optimized_resume.original_resume
        jd = optimized_resume.job_description
        
        # Optimize resume
        optimized_content = AIService.optimize_resume(resume.parsed_content, jd.content)
        
        # Generate PDF
        pdf_file = PDFService.generate_resume_pdf(optimized_content)
        
        # Update optimized resume
        optimized_resume.optimized_content = optimized_content
        optimized_resume.pdf_file.save(
            f'resume_{optimized_resume_id}.pdf',
            ContentFile(pdf_file.read())
        )
        optimized_resume.save()
        
        return {'status': 'success', 'optimized_resume_id': optimized_resume_id}
    except Exception as e:
        logger.error(f"Error optimizing resume {optimized_resume_id}: {str(e)}")
        return {'status': 'error', 'message': str(e)}


@shared_task
def generate_cover_letter_task(cover_letter_id):
    """Async task to generate cover letter"""
    try:
        cover_letter = CoverLetter.objects.get(id=cover_letter_id)
        optimized_resume = cover_letter.optimized_resume
        
        # Generate cover letter content
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
        
        # Update cover letter
        cover_letter.content = content
        cover_letter.pdf_file.save(
            f'cover_letter_{cover_letter_id}.pdf',
            ContentFile(pdf_file.read())
        )
        cover_letter.save()
        
        return {'status': 'success', 'cover_letter_id': cover_letter_id}
    except Exception as e:
        logger.error(f"Error generating cover letter {cover_letter_id}: {str(e)}")
        return {'status': 'error', 'message': str(e)}
