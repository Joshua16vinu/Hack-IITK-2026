from pathlib import Path
import json
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
import base64

from helpers.llm_helper import call_llm
from constants import BACKEND_BASE_DIR

GET_TITLES_PROMPT = """Extract the titles of all sections and subsections from the following policy document text: {pdf_content}. Return the titles in plain text as I am streaming."""


def upload_pdf(file_path: str):
    with open(file_path, "rb") as f:
        base64_pdf = base64.b64encode(f.read()).decode("utf-8")
        
    try:
        llm_response = call_llm(GET_TITLES_PROMPT.format(pdf_content=base64_pdf))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "LLM processing failed", "error": str(e)})
        )
    
    return llm_response


if __name__ == "__main__":
    project_root = Path(BACKEND_BASE_DIR).parent
    test_pdf = project_root / "policies" / "sample_policy.pdf"

    titles = upload_pdf(test_pdf)
    
    print("Extracted Titles:")
    print(titles)
    