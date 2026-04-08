import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from helpers.llm_helper import stream_llm
from helpers.logger import get_logger
from constants import PHI_MODEL, MISTRAL_MODEL
from prompts.construct_roadmap import ROADMAP_PROMPT, ROADMAP_SYSTEM_PROMPT

class RoadmapRequest(BaseModel):
    input_policy: str
    gaps: str
    mode: str

roadmap_router = APIRouter()
logger = get_logger(__name__)

@roadmap_router.post("/get-roadmap")
async def roadmap(request: RoadmapRequest):
    if not request.input_policy or not request.gaps:
        logger.warning("Roadmap request rejected because input_policy or gaps was missing")
        raise HTTPException(
            status_code=400,
            detail=json.dumps({"message": "Missing 'input_policy' or 'gaps'"})
        )
        
    if request.mode == "rapid":
        MODEL_NAME = PHI_MODEL
    else:
        MODEL_NAME = MISTRAL_MODEL
    
    try:
        logger.info("Starting roadmap generation")
        llm_response = stream_llm(ROADMAP_SYSTEM_PROMPT, ROADMAP_PROMPT.format(
            original_policy=request.input_policy, 
            gaps=request.gaps
        ), MODEL_NAME)
    except Exception as e:
        logger.exception("Roadmap generation failed")
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "LLM processing failed", "error": str(e)})
        )
    
    return StreamingResponse(llm_response, media_type="text/event-stream")