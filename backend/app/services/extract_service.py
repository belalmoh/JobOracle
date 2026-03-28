import fitz
import docx
from pathlib import Path


class TextExtractionService:
    """Service for extracting text from resume files."""

    def extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF (fitz)."""
        try:
            doc = fitz.open(file_path)
            text = "\n".join([page.get_text() for page in doc])
            doc.close()
            return text.strip()
        except Exception as e:
            raise ValueError(f"PDF extraction failed: {str(e)}")

    def extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX using python-docx."""
        try:
            doc = docx.Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            return text.strip()
        except Exception as e:
            raise ValueError(f"DOCX extraction failed: {str(e)}")

    def extract(self, file_path: str, file_type: str) -> str:
        """Extract text based on file type."""
        file_type = file_type.lower()

        if file_type == "pdf":
            return self.extract_from_pdf(file_path)
        elif file_type == "docx":
            return self.extract_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")


text_extraction_service = TextExtractionService()
