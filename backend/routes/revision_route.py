import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from helpers.llm_helper import stream_llm
from helpers.logger import get_logger
from prompts.policy_revision import REVISED_POLICY_PROMPT, REVISED_POLICY_SYSTEM_PROMPT

class RevisionRequest(BaseModel):
    text: str
    gap_analysis: str

revision_router = APIRouter()
logger = get_logger(__name__)

@revision_router.post("/revised-policy")
async def revise_policy(request: RevisionRequest):
    if not request.text or not request.gap_analysis:
        logger.warning("Revised policy request rejected because text or gap_analysis was empty")
        raise HTTPException(
            status_code=400,
            detail={"message": "Missing 'text' or 'gap_analysis' (cannot be empty strings)"}
        )

    try:
        logger.info("Starting revised policy generation")
        llm_response = stream_llm(REVISED_POLICY_SYSTEM_PROMPT, REVISED_POLICY_PROMPT.format(
            organization_policy=request.text, 
            gap_analysis=request.gap_analysis
        ))
    except Exception as e:
        logger.exception("Revised policy generation failed")
        raise HTTPException(
            status_code=500,
            detail={"message": "LLM processing failed", "error": str(e)}
        )
    
    return StreamingResponse(llm_response, media_type="text/event-stream")