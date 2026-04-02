import pdfplumber
import hashlib
import re

def generate_file_id(file_bytes: bytes, domain: str | None = None) -> str:
    md5 = hashlib.md5(file_bytes).hexdigest()
    return f"{md5}_{domain}" if domain else md5

def clean_text(text: str) -> str:
    text = re.sub(r'\n{2,}', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = text.replace('\x0c', '')
    return text.strip()

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

    if not text.strip():
        raise ValueError("No text extracted from PDF")

    cleaned_text = clean_text(text)

    return cleaned_text