from pathlib import Path
import json
from helpers.pdf_helper import extract_text_from_pdf
from fastapi import HTTPException

from helpers.llm_helper import call_llm, stream_llm
from constants import BACKEND_BASE_DIR

GET_TITLES_PROMPT = """Extract the titles of all sections and subsections from the following policy document text: {pdf_content}. Return the titles in plain text as I am streaming."""


def upload_pdf(file_path: str):
    text = extract_text_from_pdf(file_path)
    prompt = GET_TITLES_PROMPT.format(pdf_content=text)
    
    return prompt


if __name__ == "__main__":
    project_root = Path(BACKEND_BASE_DIR).parent
    test_pdf = project_root / "policies" / "sample_policy.pdf"

    prompt = upload_pdf(test_pdf)
    print("Prompt prepared, sending to LLM...")
    print(prompt)
    try:
        llm_response = call_llm(prompt)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "LLM processing failed", "error": str(e)})
        )
    
    print("LLM Response:")
    # for chunk in llm_response:
    #     print(chunk)
        
    print(llm_response)
    