from fastapi import APIRouter, HTTPException

from services.storage_service import load_result, result_exists
from helpers.logger import get_logger

storage_router = APIRouter()
logger = get_logger(__name__)


@storage_router.get("/get-analysis/{file_id}")
async def get_analysis(file_id: str):
    """Retrieve a cached PDF analysis result by its file_id (UUID)."""
    if not result_exists(file_id):
        logger.warning("No stored analysis found for file_id=%s", file_id)
        raise HTTPException(
            status_code=404,
            detail=f"No analysis found for file_id '{file_id}'"
        )

    data = load_result(file_id)
    if data is None:
        logger.error("Stored analysis for file_id=%s could not be read", file_id)
        raise HTTPException(
            status_code=500,
            detail="Stored result could not be read"
        )

    logger.info("Loaded stored analysis for file_id=%s", file_id)
    return {"file_id": file_id, "result": data}
