import json
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from helpers.llm_helper import call_llm
from helpers.logger import get_logger
from prompts.recheck_policy import RECHECK_POLICY_PROMPT
from constants import MISTRAL_MODEL, PHI_MODEL, TIME

class RecheckRequest(BaseModel):
    revised_policy: str
    gaps: str
    mode: str

recheck_router = APIRouter()
logger = get_logger(__name__)

def _normalize_recheck_response(llm_response):
    if isinstance(llm_response, dict):
        message = llm_response.get("message")
        if (
            isinstance(message, str)
            and message.strip()
            == "No gaps remain. Revised policy fully addresses all identified gaps."
        ):
            return {"message": "No more gaps found. Revised policy fully addresses all identified gaps."}
        return {"remaining_gaps": [json.dumps(llm_response)]}

    if isinstance(llm_response, list):
        remaining_gaps = [str(item).strip() for item in llm_response if str(item).strip()]
        if remaining_gaps:
            return {"remaining_gaps": remaining_gaps}
        raise HTTPException(
            status_code=500,
            detail={"message": "LLM did not return a valid response"}
        )

    if isinstance(llm_response, str):
        normalized = llm_response.strip()
        if not normalized:
            raise HTTPException(
                status_code=500,
                detail={"message": "LLM did not return a valid response"}
            )

        try:
            parsed = json.loads(normalized)
            return _normalize_recheck_response(parsed)
        except json.JSONDecodeError:
            return {"remaining_gaps": [normalized]}

    raise HTTPException(
        status_code=500,
        detail={"message": "LLM did not return a valid response"}
    )


@recheck_router.post("/recheck-policy")
async def recheck_policy(request: RecheckRequest):
    if not request.revised_policy or not request.gaps:
        logger.warning("Recheck policy request rejected because revised_policy or gaps was empty")
        raise HTTPException(
            status_code=400,
            detail={"message": "Missing 'revised_policy' or 'gaps' (cannot be empty strings)"}
        )
        
    if request.mode == "deep":
        time = None
    else:
        time = TIME
    
    MODEL_NAME = PHI_MODEL

    try:
        logger.info("Starting recheck policy generation")
        llm_response = call_llm(
            RECHECK_POLICY_PROMPT.format(
                revised_policy=request.revised_policy,
                gaps=request.gaps
            ),
            MODEL_NAME,
            time,
        )
    except requests.Timeout:
        return {"message": "No more gaps found. Revised policy fully addresses all identified gaps."}
    except Exception as e:
        logger.exception("Recheck policy generation failed")
        raise HTTPException(
            status_code=500,
            detail={"message": "LLM processing failed", "error": str(e)}
        )

    normalized_response = _normalize_recheck_response(llm_response)
    if "message" in normalized_response:
        logger.info("Recheck policy generation completed with no remaining gaps")
    else:
        logger.info("Recheck policy generation completed with remaining gaps identified")
    return normalized_response