from fastapi import APIRouter, HTTPException

from services.storage_service import load_result, result_exists

storage_router = APIRouter()


@storage_router.get("/get-analysis/{file_id}")
async def get_analysis(file_id: str):
    """Retrieve a cached PDF analysis result by its file_id (UUID)."""
    if not result_exists(file_id):
        raise HTTPException(
            status_code=404,
            detail=f"No analysis found for file_id '{file_id}'"
        )

    data = load_result(file_id)
    if data is None:
        raise HTTPException(
            status_code=500,
            detail="Stored result could not be read"
        )

    return {"file_id": file_id, "result": data}
