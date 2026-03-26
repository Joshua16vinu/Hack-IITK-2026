import os
import json
from fastapi import APIRouter, UploadFile, File, HTTPException

from helpers.pdf_helper import extract_text_from_pdf
from helpers.llm_helper import call_llm
from prompts.input_policy_tagging import INPUT_POLICY_TAGGING_PROMPT
from constants import UPLOAD_FOLDER

upload_router = APIRouter()

@upload_router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process a PDF file"""

    # Validate file
    if not file or file.filename == "":
        raise HTTPException(status_code=400, detail="No file found")
    
    if not (file.filename.lower().endswith(".pdf")):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    if not UPLOAD_FOLDER:
        raise HTTPException(status_code=500, detail="Upload folder not configured")
    
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    
    # Save uploaded file
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        text = extract_text_from_pdf(file_path)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=json.dumps({"message": "PDF extraction failed", "error": str(e)})
        )

    # Call LLM with the extracted text
    try:
        llm_response = call_llm(INPUT_POLICY_TAGGING_PROMPT.format(policy_text=text))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "LLM processing failed", "error": str(e)})
        )
        
    return llm_response