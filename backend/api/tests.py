from unittest.mock import patch

from django.test import SimpleTestCase

from .ai_service import AIService


class PlainTextSectionLockTests(SimpleTestCase):
    def setUp(self):
        self.resume_text = (
            "Aleena Jomy\n"
            "Software Developer\n"
            "SUMMARY\n"
            "Curious software graduate with web development experience.\n"
            "EXPERIENCE\n"
            "Python Django Developer Intern at Zecser Business LLP.\n"
            "PROJECTS\n"
            "Stylo virtual wardrobe app built with Django and React.\n"
            "SKILLS\n"
            "Python, Django, React, MySQL\n"
            "EDUCATION\n"
            "B.Tech in Computer Science and Engineering.\n"
        )
        self.job_data = {
            'company_name': 'Acme',
            'job_title': 'Backend Developer',
            'job_description': 'Need Python, Django, API design, debugging, and collaboration skills.',
            'requirements': 'Strong communication and ownership.',
        }
        self.user_profile = {
            'full_name': 'Aleena Jomy',
            'email': 'aleena@example.com',
            'skills': ['Python', 'Django'],
        }

    @patch('api.ai_service.AIService._call_openai_with_retry')
    def test_optimize_plain_text_resume_only_updates_allowed_sections(self, mock_ai_call):
        mock_ai_call.return_value = (
            {
                'headline': 'Backend Developer Intern',
                'summary': 'Detail-oriented backend developer focused on Django APIs and clean code.',
                'skills': 'Python, Django, REST APIs, PostgreSQL, Testing',
                'changes_made': ['Updated summary for role alignment.', 'Updated skills for ATS matching.'],
            },
            {'prompt_tokens': 10, 'completion_tokens': 20, 'total_tokens': 30},
        )

        original_sections = AIService.extract_plain_text_sections(self.resume_text)
        result = AIService.optimize_plain_text_resume(
            resume_text=self.resume_text,
            job_data=self.job_data,
            user_profile=self.user_profile,
        )
        updated_text = result['updated_resume_text']
        updated_sections = AIService.extract_plain_text_sections(updated_text)

        self.assertIn('Backend Developer Intern', updated_text)
        self.assertIn('Detail-oriented backend developer focused on Django APIs and clean code.', updated_text)
        self.assertIn('Python, Django, REST APIs, PostgreSQL, Testing', updated_text)

        for protected in ('experience', 'projects', 'education'):
            self.assertIn(protected, original_sections)
            self.assertIn(protected, updated_sections)
            self.assertEqual(
                original_sections[protected]['content'],
                updated_sections[protected]['content'],
                msg=f"{protected} section should remain unchanged",
            )

        self.assertEqual(result['token_usage']['total_tokens'], 30)

    def test_optimize_plain_text_resume_requires_editable_targets(self):
        resume_without_targets = (
            "Aleena Jomy\n"
            "aleena@example.com\n"
            "+91 9876543210\n"
        )

        with self.assertRaisesMessage(ValueError, "Headline, Summary, or Skills section not found in resume."):
            AIService.optimize_plain_text_resume(
                resume_text=resume_without_targets,
                job_data=self.job_data,
                user_profile=self.user_profile,
            )


class LatexTemplatePlaceholderTests(SimpleTestCase):
    def test_has_latex_template_placeholders(self):
        template_text = r"\section{Summary}{{SUMMARY}}"
        self.assertTrue(AIService.has_latex_template_placeholders(template_text))
        self.assertFalse(AIService.has_latex_template_placeholders(r"\section{Summary}Hello"))

    def test_render_latex_template_placeholders(self):
        template_text = (
            "Name Line\n"
            "{{HEADLINE}}\n"
            "\\section{Summary}\n"
            "{{SUMMARY}}\n"
            "\\section{Skills}\n"
            "{{SKILLS}}\n"
        )

        rendered = AIService.render_latex_template_placeholders(
            latex_text=template_text,
            headline="Software Engineer Intern",
            summary="Experienced in Python and backend APIs.",
            skills="Python, Django, REST APIs, PostgreSQL",
        )

        self.assertIn("Software Engineer Intern", rendered)
        self.assertIn("Experienced in Python and backend APIs.", rendered)
        self.assertIn("Python, Django, REST APIs, PostgreSQL", rendered)
        self.assertNotIn("{{HEADLINE}}", rendered)
        self.assertNotIn("{{SUMMARY}}", rendered)
        self.assertNotIn("{{SKILLS}}", rendered)
