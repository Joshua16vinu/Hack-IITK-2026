import os
import json

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional

from helpers.pdf_helper import extract_text_from_pdf
from helpers.chunking_helper import sentence_based_chunking
from constants import UPLOAD_FOLDER
from services.upload_service import classify_pdf_chunk, restructure_chunks_by_domain, get_domain_chunks_with_policies
from services.storage_service import generate_file_id, result_exists, load_result, save_result

upload_router = APIRouter()

@upload_router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    domain: Optional[str] = Form(None),
    file_id: Optional[str] = Form(None),
):
    """Upload and process a PDF file.

    If *file_id* is supplied and a cached result exists it is returned
    immediately without reprocessing the PDF.
    """

    # ── Cache hit: return stored result ──────────────────────────────────────
    if file_id and result_exists(file_id):
        cached = load_result(file_id)
        return {"file_id": file_id, "cached": True, "result": cached}

    # ── Generate a fresh file_id for this upload ─────────────────────────────
    file_id = generate_file_id()

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

    # ── Persist result and return with file_id ────────────────────────────────
    save_result(file_id, domain_chunks_policies)

    return {"file_id": file_id, "cached": False, "result": domain_chunks_policies}