from pydantic import BaseModel
from typing import Optional

from fastapi import APIRouter, Request, BackgroundTasks

from services.gaps_service import process_data, current_job
from helpers.logger import get_logger

gaps_router = APIRouter()
logger = get_logger(__name__)

class NistPolicy(BaseModel):
    id: str
    content: str
    policy_template: Optional[str] = None

class DataItem(BaseModel):
    domain: str
    text: list[str]
    related_nist_policies: list[NistPolicy]

class GapAnalysisRequest(BaseModel):
    data: list[DataItem]
    mode: str

@gaps_router.post("/analyze-gaps")
async def analyze_gaps(request: GapAnalysisRequest, background_tasks: BackgroundTasks):
    global current_job

    if current_job["status"] == "processing":
        logger.warning("Gap analysis request rejected because a job is already processing")
        return {"message": "LLM already running", "status": "processing"}

    if not request.data:
        logger.warning("Gap analysis request received with empty payload")
        return {"status": "failed", "message": "No data provided"}

    # reset state
    current_job["status"] = "processing"
    current_job["results"] = []
    current_job["completed"] = 0
    current_job["total"] = 0
    current_job.pop("error", None)

    logger.info("Starting gap analysis for %s domains", len(request.data))
    background_tasks.add_task(process_data, request.data, request.mode)

    return current_job


@gaps_router.get("/analyze-gaps")
async def get_status():
    logger.debug("Gap analysis status requested")
    return current_job