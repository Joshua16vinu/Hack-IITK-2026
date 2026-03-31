import os
import json

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional

from helpers.pdf_helper import extract_text_from_pdf
from helpers.chunking_helper import sentence_based_chunking
from constants import UPLOAD_FOLDER
from services.upload_service import classify_pdf_chunk, restructure_chunks_by_domain, get_domain_chunks_with_policies

upload_router = APIRouter()

@upload_router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), domain: Optional[str] = Form(None)):
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

    if not domain:
        # Chunk text for further processing
        try:
            input_chunks = sentence_based_chunking(text)
            print(f"Total chunks created: {len(input_chunks)}")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=json.dumps({"message": "Chunking failed", "error": str(e)})
            )
            
        classes = []
        try: 
            for chunk in input_chunks:
                classes.append(classify_pdf_chunk(chunk))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=json.dumps({"message": "Classification failed", "error": str(e)})
            )
            
        try:
            domain_wise_chunks = restructure_chunks_by_domain(classes)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=json.dumps({"message": "Restructuring failed", "error": str(e)})
            )
    else:
        try:
          input_chunks = sentence_based_chunking(text)
          print(f"Total chunks created: {len(input_chunks)}")
        except Exception as e:
          raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "Chunking failed", "error": str(e)})
         )

        domain_wise_chunks = [{
         "domain": domain,
         "text": input_chunks   # ✅ list of chunks
        }]
        
    try:
        domain_chunks_policies = get_domain_chunks_with_policies(domain_wise_chunks)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "Policy retrieval failed", "error": str(e)})
        )
        
    return domain_chunks_policies