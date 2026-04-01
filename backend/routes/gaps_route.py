from fastapi import APIRouter, Request, BackgroundTasks

from services.gaps_service import process_data, current_job

gaps_router = APIRouter()

@gaps_router.post("/analyze-gaps")
async def analyze_gaps(request: Request, background_tasks: BackgroundTasks):
    global current_job

    if current_job["status"] == "processing":
        return {"message": "LLM already running", "status": "processing"}

    data = await request.json()

    # ✅ Handle empty input
    if not data:
        return {"status": "failed", "message": "No data provided"}

    # reset state
    current_job["status"] = "processing"
    current_job["results"] = []
    current_job["completed"] = 0
    current_job["total"] = 0
    current_job.pop("error", None)

    background_tasks.add_task(process_data, data)

    return current_job


@gaps_router.get("/analyze-gaps")
async def get_status():
    return current_job