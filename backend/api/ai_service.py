import json
import logging
import time
from django.conf import settings
from openai import APIError, OpenAI, RateLimitError

logger = logging.getLogger(__name__)

client_kwargs = {'api_key': settings.OPENAI_API_KEY}
if settings.OPENAI_BASE_URL:
    client_kwargs['base_url'] = settings.OPENAI_BASE_URL

client = OpenAI(**client_kwargs)
MODEL_NAME = settings.AI_MODEL

class AIService:
    @staticmethod
    def _call_openai_with_retry(prompt, temperature=0.3, max_retries=3):
        """Call OpenAI API with retry logic"""
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    timeout=30
                )
                content = response.choices[0].message.content
                
                # Try to parse JSON
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    # Try to extract JSON from markdown code blocks
                    if '```json' in content:
                        json_str = content.split('```json')[1].split('```')[0].strip()
                        return json.loads(json_str)
                    elif '```' in content:
                        json_str = content.split('```')[1].split('```')[0].strip()
                        return json.loads(json_str)
                    else:
                        raise ValueError(f"Invalid JSON response from OpenAI: {content[:200]}")
                        
            except RateLimitError:
                logger.warning(f"Rate limit hit, attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    raise Exception("OpenAI rate limit exceeded. Please try again later.")
            except APIError as e:
                logger.error(f"OpenAI API error: {str(e)}")
                raise Exception(f"AI service error: {str(e)}")
            except Exception as e:
                logger.error(f"Unexpected error calling OpenAI: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                else:
                    raise Exception(f"Failed to process request: {str(e)}")
        
        raise Exception("Failed to get response from AI service")

    @staticmethod
    def extract_keywords(job_description):
        """Extract keywords from job description"""
        if not job_description or len(job_description.strip()) < 20:
            raise ValueError("Job description is too short")
            
        prompt = f"""Extract technical skills, tools, frameworks, soft skills, and action verbs 
from the following job description. Return ONLY a JSON object with these keys:
- technical_skills: list of technical skills
- tools: list of tools and technologies
- soft_skills: list of soft skills
- action_verbs: list of action verbs

Job Description:
{job_description}"""

        try:
            return AIService._call_openai_with_retry(prompt, temperature=0.3)
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            raise

    @staticmethod
    def parse_resume(resume_text):
        """Parse resume text into structured data"""
        if not resume_text or len(resume_text.strip()) < 50:
            raise ValueError("Resume text is too short or empty")
            
        prompt = f"""Parse the following resume and extract:
- name
- email
- phone
- skills: list of skills
- experience: list of {{title, company, duration, responsibilities}}
- education: list of {{degree, institution, year}}

Return ONLY valid JSON.

Resume:
{resume_text}"""

        try:
            return AIService._call_openai_with_retry(prompt, temperature=0.3)
        except Exception as e:
            logger.error(f"Error parsing resume: {str(e)}")
            raise

    @staticmethod
    def calculate_ats_score(resume_keywords, jd_keywords):
        """Calculate ATS compatibility score"""
        try:
            if not isinstance(resume_keywords, dict) or not isinstance(jd_keywords, dict):
                raise ValueError("Invalid keyword format")
                
            all_jd_keywords = []
            for key in ['technical_skills', 'tools', 'soft_skills']:
                if key in jd_keywords and isinstance(jd_keywords[key], list):
                    all_jd_keywords.extend([k.lower().strip() for k in jd_keywords[key] if k])
            
            if not all_jd_keywords:
                return {'score': 0, 'matched': [], 'missing': []}
            
            resume_skills = resume_keywords.get('skills', [])
            if not isinstance(resume_skills, list):
                resume_skills = []
                
            resume_keywords_lower = [k.lower().strip() for k in resume_skills if k]
            
            matched = list(set([k for k in all_jd_keywords if k in resume_keywords_lower]))
            missing = list(set([k for k in all_jd_keywords if k not in resume_keywords_lower]))
            
            score = (len(matched) / len(all_jd_keywords) * 100) if all_jd_keywords else 0
            
            return {
                'score': round(score, 2),
                'matched': matched,
                'missing': missing
            }
        except Exception as e:
            logger.error(f"Error calculating ATS score: {str(e)}")
            return {'score': 0, 'matched': [], 'missing': []}

    @staticmethod
    def optimize_resume(resume_data, job_description):
        """Optimize resume for job description"""
        if not isinstance(resume_data, dict):
            raise ValueError("Invalid resume data format")
        if not job_description or len(job_description.strip()) < 20:
            raise ValueError("Job description is too short")
            
        prompt = f"""Rewrite the following resume tailored for this job description.
Requirements:
- Keep ATS-friendly formatting (no tables, no graphics)
- Use strong action verbs
- Highlight relevant skills and experience
- Keep it concise
- Return ONLY valid JSON with the same structure as input

Job Description:
{job_description}

Resume Data:
{json.dumps(resume_data, indent=2)}"""

        try:
            return AIService._call_openai_with_retry(prompt, temperature=0.5)
        except Exception as e:
            logger.error(f"Error optimizing resume: {str(e)}")
            raise

    @staticmethod
    def generate_cover_letter(resume_data, job_description, job_title):
        """Generate cover letter"""
        if not isinstance(resume_data, dict):
            raise ValueError("Invalid resume data format")
        if not job_description or len(job_description.strip()) < 20:
            raise ValueError("Job description is too short")
            
        prompt = f"""Generate a professional job-specific cover letter.
Requirements:
- Use the resume and job description
- Keep it concise (3-4 paragraphs)
- Professional and formal tone
- Address the job title: {job_title}
- Return plain text, not JSON

Resume:
{json.dumps(resume_data, indent=2)}

        Job Description:
{job_description}"""

        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                timeout=30
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating cover letter: {str(e)}")
            raise Exception(f"Failed to generate cover letter: {str(e)}")
