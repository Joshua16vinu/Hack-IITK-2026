import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from helpers.llm_helper import stream_llm
from prompts.policy_revision import REVISED_POLICY_PROMPT
from constants import UPLOAD_FOLDER

from pydantic import BaseModel

class RevisionRequest(BaseModel):
    text: str
    gap_analysis: str

revision_router = APIRouter()

@revision_router.post("/revised-policy")
async def revise_policy(request: RevisionRequest):
    if not request.text or not request.gap_analysis:
        raise HTTPException(
            status_code=400,
            detail={"message": "Missing 'text' or 'gap_analysis' (cannot be empty strings)"}
        )

    try:
        llm_response = stream_llm(REVISED_POLICY_PROMPT.format(
            organization_policy=request.text, 
            gap_analysis=request.gap_analysis
        ))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "LLM processing failed", "error": str(e)}
        )
    
    return StreamingResponse(llm_response, media_type="text/event-stream")