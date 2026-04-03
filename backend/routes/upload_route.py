import os
import json

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional

from helpers.pdf_helper import extract_text_from_pdf, generate_file_id
from helpers.chunking_helper import sentence_based_chunking
from helpers.logger import get_logger
from constants import UPLOAD_FOLDER
from services.upload_service import batch_chunks, classify_pdf_chunk, restructure_chunks_by_domain, get_domain_chunks_with_policies
import uuid

upload_router = APIRouter()
logger = get_logger(__name__)

@upload_router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    domain: Optional[str] = Form(None),
):
    """Upload and process a PDF file.
    
    If domain is provided, chunks are batched in groups of 3-4.
    Response includes NIST policy IDs for frontend filtering.
    """

    # Validate file
    if not file or file.filename == "":
        logger.warning("Upload request rejected - no file provided")
        raise HTTPException(status_code=400, detail="No file found")

    if not file.filename.lower().endswith(".pdf"):
        logger.warning("Upload request rejected - not a PDF: %s", file.filename)
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    if not UPLOAD_FOLDER:
        logger.error("Upload folder not configured")
        raise HTTPException(status_code=500, detail="Upload folder not configured")

    # Read file and generate ID
    try:
        contents = await file.read()
    except Exception as e:
        logger.exception("Failed to read uploaded file")
        raise HTTPException(status_code=500, detail="Failed to read file")

    file_id = generate_file_id(contents, domain)
    logger.info("Processing file_id=%s domain=%s", file_id, domain or "auto")

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Extract PDF text
    try:
        text = extract_text_from_pdf(file_path)
    except ValueError as e:
        logger.exception("PDF extraction failed for file_id=%s", file_id)
        raise HTTPException(
            status_code=400,
            detail=json.dumps({"message": "PDF extraction failed", "error": str(e)})
        )

    # Chunk text into sentences and then into chunks
    try:
        input_chunks = sentence_based_chunking(text)
        logger.info("Created %d chunks for file_id=%s", len(input_chunks), file_id)
    except Exception as e:
        logger.exception("Chunking failed for file_id=%s", file_id)
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "Chunking failed", "error": str(e)})
        )

    # Process chunks based on domain specification
    try:
        if domain:
            # Manual mode: batch chunks into groups for the specified domain
            batches = batch_chunks(input_chunks)
            domain_wise_chunks = [
                {"domain": domain, "text": batch}
                for batch in batches
            ]
            logger.info("Created %d batches for manual domain=%s", len(batches), domain)
        else:
            # Auto mode: classify each chunk and restructure by domain
            classes = [classify_pdf_chunk(chunk) for chunk in input_chunks]
            domain_wise_chunks = restructure_chunks_by_domain(classes)
            logger.info("Auto-classified into %d domains", len(domain_wise_chunks))

    except Exception as e:
        logger.exception("Classification/batching failed for file_id=%s", file_id)
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "Classification failed", "error": str(e)})
        )

    # Retrieve policies for domains and include NIST policy IDs
    try:
        domain_chunks_policies = get_domain_chunks_with_policies(domain_wise_chunks)
    except Exception as e:
        logger.exception("Policy retrieval failed for file_id=%s", file_id)
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "Policy retrieval failed", "error": str(e)})
        )
        
    logger.info("Upload completed for file_id=%s", file_id)

    return {
        "file_id": file_id,
        "result": domain_chunks_policies,
        "extracted_text": text
    }