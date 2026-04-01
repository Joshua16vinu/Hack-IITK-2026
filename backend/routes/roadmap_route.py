import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from helpers.llm_helper import stream_llm
from helpers.logger import get_logger
from prompts.construct_roadmap import ROADMAP_PROMPT

roadmap_router = APIRouter()
logger = get_logger(__name__)

@roadmap_router.post("/get-roadmap")
async def roadmap(request: Request):
    try:
        data = await request.json()
    except Exception as e:
        logger.warning("Roadmap request rejected due to invalid JSON")
        raise HTTPException(
            status_code=400,
            detail=json.dumps({"message": "Invalid JSON", "error": str(e)})
        )

    original_policy = data.get("input_policy")
    revised_policy = data.get("revised_policy")
    
    if not original_policy or not revised_policy:
        logger.warning("Roadmap request rejected because input_policy or revised_policy was missing")
        raise HTTPException(
            status_code=400,
            detail=json.dumps({"message": "Missing 'input_policy' or 'revised_policy'"})
        )
    
    try:
        logger.info("Starting roadmap generation")
        llm_response = stream_llm(ROADMAP_PROMPT.format(original_policy=original_policy, revised_policy=revised_policy))
    except Exception as e:
        logger.exception("Roadmap generation failed")
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "LLM processing failed", "error": str(e)})
        )
    
    return StreamingResponse(llm_response, media_type="text/event-stream")