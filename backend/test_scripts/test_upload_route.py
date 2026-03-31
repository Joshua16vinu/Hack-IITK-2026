from pathlib import Path

from helpers.pdf_helper import extract_text_from_pdf
from helpers.chunking_helper import sentence_based_chunking
from constants import BACKEND_BASE_DIR
from services.upload_service import classify_pdf_chunk, get_domain_chunks_with_policies, restructure_chunks_by_domain


def upload_pdf(file_path: str):
    text = extract_text_from_pdf(file_path)

    input_chunks = sentence_based_chunking(text)

    return input_chunks



if __name__ == "__main__":
    project_root = Path(BACKEND_BASE_DIR).parent
    test_pdf = project_root / "policies" / "sample_policy.pdf"

    input_chunks = upload_pdf(test_pdf)
    print(f"Total chunks created: {len(input_chunks)}")
    
    classes = []
    for chunk in input_chunks:
        classes.append(classify_pdf_chunk(chunk))
        
    domain_wise_chunks = restructure_chunks_by_domain(classes)
    domain_chunks_policies = get_domain_chunks_with_policies(domain_wise_chunks)
    
    print(domain_chunks_policies)