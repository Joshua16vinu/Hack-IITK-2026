import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from helpers.llm_helper import stream_llm
from prompts.policy_revision import REVISED_POLICY_PROMPT
from constants import UPLOAD_FOLDER

revision_router = APIRouter()

@revision_router.post("/revised-policy")
async def revise_policy(request: Request):
    try:
        data = await request.json()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=json.dumps({"message": "Invalid JSON", "error": str(e)})
        )

    text = data.get("text")
    gap_analysis = data.get("gap_analysis")

    if not text or not gap_analysis:
        raise HTTPException(
            status_code=400,
            detail=json.dumps({"message": "Missing 'text' or 'gap_analysis'"})
        )

    try:
        llm_response = stream_llm(REVISED_POLICY_PROMPT.format(organization_policy=text, gap_analysis=gap_analysis))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=json.dumps({"message": "LLM processing failed", "error": str(e)})
        )
    
    return StreamingResponse(llm_response, media_type="text/event-stream")