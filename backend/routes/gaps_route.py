from fastapi import APIRouter, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
import uuid

from backend.services.gaps_service import process_data

gaps_router = APIRouter()
jobs = {}

@gaps_router.post("/analyze-gaps")
async def analyze_gaps(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()

    job_id = str(uuid.uuid4())

    # create job
    jobs[job_id] = {
        "status": "processing",
        "results": []
    }

    # run in background
    background_tasks.add_task(process_data, job_id, data)

    return {
        "job_id": job_id,
        "status": "processing"
    }
    
    

@gaps_router.get("/analyze-gaps/{job_id}")
async def get_status(job_id: str):
    return jobs.get(job_id, {"status": "not_found"})