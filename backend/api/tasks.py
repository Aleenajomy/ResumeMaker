from celery import shared_task
from django.core.files.base import ContentFile
from .models import Resume, JobDescription, OptimizedResume, CoverLetter
from .ai_service import AIService
from .pdf_service import PDFService
import logging

logger = logging.getLogger(__name__)


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
