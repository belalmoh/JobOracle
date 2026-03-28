import json
import subprocess
import re
from typing import Optional


class ResumeParserService:
    """Service for parsing resume text using AI and regex."""

    def __init__(self):
        self.ai_model = "llama3.2"
        self.max_text_length = 3000

    def extract_contact_info(self, text: str) -> dict:
        """Extract basic contact info using regex."""
        contact = {"name": "", "email": "", "phone": "", "location": ""}

        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        if email_match:
            contact["email"] = email_match.group()

        phone_match = re.search(
            r"(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}", text
        )
        if phone_match:
            contact["phone"] = phone_match.group()

        lines = text.split("\n")
        if lines:
            first_line = lines[0].strip()
            if (
                len(first_line) > 2
                and "@" not in first_line
                and not any(c.isdigit() for c in first_line)
            ):
                contact["name"] = first_line.title()

        return contact

    def parse_with_ai(self, text: str) -> Optional[dict]:
        """Parse resume using local AI (ollama)."""

        prompt = f"""You are a professional resume parser. Extract structured information from this resume text.

Return a JSON object with this exact structure:
{{
    "summary": "2-3 sentence professional summary",
    "skills": ["skill1", "skill2", "skill3"],
    "experience": [
        {{"title": "Job Title", "company": "Company Name", "duration": "Duration", "description": "Brief description"}}
    ],
    "education": [
        {{"degree": "Degree Name", "school": "School Name", "year": "Year"}}
    ]
}}

Resume text:
{text[: self.max_text_length]}

Return ONLY valid JSON, no other text:"""

        try:
            result = subprocess.run(
                ["ollama", "generate", self.ai_model, prompt, "--json"],
                capture_output=True,
                text=True,
                timeout=60,
            )

            if result.returncode == 0:
                try:
                    parsed = json.loads(result.stdout)
                    return parsed
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            print(f"AI parsing failed: {e}")

        return None

    def parse_fallback(self) -> dict:
        """Fallback parsing when AI is unavailable."""
        return {
            "summary": "Professional with relevant experience.",
            "skills": [],
            "experience": [],
            "education": [],
        }

    def parse(self, text: str) -> dict:
        """
        Main parse method that combines regex extraction for contact
        and AI for structured data (summary, skills, experience, education).
        """
        contact = self.extract_contact_info(text)

        ai_result = self.parse_with_ai(text)

        if ai_result is None:
            ai_result = self.parse_fallback()

        return {
            "contact": contact,
            "summary": ai_result.get("summary", ""),
            "skills": ai_result.get("skills", []),
            "experience": ai_result.get("experience", []),
            "education": ai_result.get("education", []),
            "extracted_text": text,
        }


resume_parser_service = ResumeParserService()
