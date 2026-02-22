from pypdf import PdfReader
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

class PDFService:
    @staticmethod
    def extract_text_from_pdf(file):
        """Extract text from PDF file"""
        try:
            reader = PdfReader(file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            if not text.strip():
                raise ValueError("PDF appears to be empty or scanned (no text layer)")
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise ValueError(f"Failed to read PDF file: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file):
        """Extract text from DOCX file"""
        try:
            doc = Document(file)
            text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
            
            if not text.strip():
                raise ValueError("DOCX file appears to be empty")
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}")
            raise ValueError(f"Failed to read DOCX file: {str(e)}")

    @staticmethod
    def extract_text(file):
        """Extract text from file based on extension"""
        if not file:
            raise ValueError("No file provided")
            
        filename = file.name.lower()
        
        try:
            if filename.endswith('.pdf'):
                return PDFService.extract_text_from_pdf(file)
            elif filename.endswith('.docx'):
                return PDFService.extract_text_from_docx(file)
            elif filename.endswith('.txt'):
                content = file.read()
                if isinstance(content, bytes):
                    text = content.decode('utf-8')
                else:
                    text = content
                
                if not text.strip():
                    raise ValueError("Text file is empty")
                return text
            else:
                raise ValueError("Unsupported file format. Please upload PDF, DOCX, or TXT")
        except UnicodeDecodeError:
            raise ValueError("File encoding error. Please ensure the file is valid")
        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            raise

    @staticmethod
    def generate_resume_pdf(resume_data):
        """Generate PDF from resume data"""
        if not isinstance(resume_data, dict):
            raise ValueError("Invalid resume data format")
            
        try:
            pdf_file = BytesIO()
            doc = SimpleDocTemplate(pdf_file, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []
            
            # Name
            name = resume_data.get('name', 'Your Name')
            story.append(Paragraph(name, styles['Title']))
            
            # Contact Info
            email = resume_data.get('email', '')
            phone = resume_data.get('phone', '')
            contact = f"{email} | {phone}" if email and phone else email or phone
            if contact:
                story.append(Paragraph(contact, styles['Normal']))
            story.append(Spacer(1, 12))
            
            # Skills
            skills = resume_data.get('skills', [])
            if skills and isinstance(skills, list):
                story.append(Paragraph('Skills', styles['Heading2']))
                story.append(Paragraph(', '.join(str(s) for s in skills), styles['Normal']))
                story.append(Spacer(1, 12))
            
            # Experience
            experience = resume_data.get('experience', [])
            if experience and isinstance(experience, list):
                story.append(Paragraph('Experience', styles['Heading2']))
                for exp in experience:
                    if isinstance(exp, dict):
                        title = exp.get('title', '')
                        company = exp.get('company', '')
                        duration = exp.get('duration', '')
                        story.append(Paragraph(f"{title} - {company} ({duration})", styles['Heading3']))
                        
                        responsibilities = exp.get('responsibilities', [])
                        if isinstance(responsibilities, list):
                            for resp in responsibilities:
                                story.append(Paragraph(f"• {resp}", styles['Normal']))
                        story.append(Spacer(1, 6))
            
            # Education
            education = resume_data.get('education', [])
            if education and isinstance(education, list):
                story.append(Paragraph('Education', styles['Heading2']))
                for edu in education:
                    if isinstance(edu, dict):
                        degree = edu.get('degree', '')
                        institution = edu.get('institution', '')
                        year = edu.get('year', '')
                        story.append(Paragraph(f"{degree} - {institution} ({year})", styles['Normal']))
            
            doc.build(story)
            pdf_file.seek(0)
            return pdf_file
            
        except Exception as e:
            logger.error(f"Error generating resume PDF: {str(e)}")
            raise ValueError(f"Failed to generate PDF: {str(e)}")

    @staticmethod
    def generate_cover_letter_pdf(content, name):
        """Generate cover letter PDF"""
        if not content or not content.strip():
            raise ValueError("Cover letter content is empty")
            
        try:
            pdf_file = BytesIO()
            doc = SimpleDocTemplate(pdf_file, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []
            
            story.append(Paragraph(name or 'Your Name', styles['Heading1']))
            story.append(Spacer(1, 12))
            
            for para in content.split('\n'):
                if para.strip():
                    story.append(Paragraph(para, styles['Normal']))
                    story.append(Spacer(1, 6))
            
            doc.build(story)
            pdf_file.seek(0)
            return pdf_file
            
        except Exception as e:
            logger.error(f"Error generating cover letter PDF: {str(e)}")
            raise ValueError(f"Failed to generate cover letter PDF: {str(e)}")
