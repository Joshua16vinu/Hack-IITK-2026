import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from helpers.pdf_helper import extract_text_from_pdf
from constants import BASE_DIR


def upload_pdf(file_path: str):
    text = extract_text_from_pdf(file_path)
    return text



if __name__ == "__main__":
    project_root = Path(BASE_DIR).parent
    test_pdf = project_root / "policies" / "Policy_1.pdf"

    pdf_content = upload_pdf(test_pdf)
    print(pdf_content)