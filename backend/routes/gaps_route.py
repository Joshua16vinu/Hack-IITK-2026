import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

from helpers.llm_helper import stream_llm
from prompts.policy_revision import REVISED_POLICY_PROMPT
from constants import UPLOAD_FOLDER

gaps_router = APIRouter()

@gaps_router.post("/analyze-gaps")
async def analyze_gaps(request: Request):
    return