import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from helpers.llm_helper import call_llm
from helpers.logger import get_logger
from prompts.recheck_policy import RECHECK_POLICY_PROMPT

class RecheckRequest(BaseModel):
    revised_policy: str
    gaps: str

recheck_router = APIRouter()
logger = get_logger(__name__)

@recheck_router.post("/recheck-policy")
async def recheck_policy(request: RecheckRequest):
    if not request.revised_policy or not request.gaps:
        logger.warning("Recheck policy request rejected because revised_policy or gaps was empty")
        raise HTTPException(
            status_code=400,
            detail={"message": "Missing 'revised_policy' or 'gaps' (cannot be empty strings)"}
        )

    try:
        logger.info("Starting recheck policy generation")
        llm_response = call_llm(RECHECK_POLICY_PROMPT.format(
            revised_policy=request.revised_policy,
            gaps=request.gaps
        ))
    except Exception as e:
        logger.exception("Recheck policy generation failed")
        raise HTTPException(
            status_code=500,
            detail={"message": "LLM processing failed", "error": str(e)}
        )

    if(json.loads(llm_response)):
        if ("message" in llm_response and llm_response["message"] == "No gaps remain. Revised policy fully addresses all identified gaps."):
            logger.info("Recheck policy generation completed with no remaining gaps")
            return {"message": "No more gaps found. Revised policy fully addresses all identified gaps."}
        else:
            logger.info("Recheck policy generation completed with remaining gaps identified")
            return {"remaining_gaps": llm_response}
    else:
        logger.warning("Recheck policy generation completed but no valid response was returned")
        raise HTTPException(
            status_code=500,
            detail={"message": "LLM did not return a valid response"}
        )