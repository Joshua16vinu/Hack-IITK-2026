from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import requests
import time
import os
import uvicorn

from constants import UPLOAD_FOLDER, STORAGE_FOLDER
from helpers.logger import setup_logging, get_logger
from routes.upload_route import upload_router
from routes.gaps_route import gaps_router
from routes.revision_route import revision_router
from routes.roadmap_route import roadmap_router
from routes.storage_route import storage_router


setup_logging()
logger = get_logger(__name__)


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(STORAGE_FOLDER, exist_ok=True)
    logger.info("Backend startup complete. Upload folder ready at %s", UPLOAD_FOLDER)
    logger.info("Storage folder ready at %s", STORAGE_FOLDER)

@app.get('/')
async def health_check():
    return {'message': 'Backend is running...'}

@app.get('/check-llm')
async def check_llm():
    try:
        requests.get("http://localhost:11434")
        logger.info("LLM health check passed")
        return {'message': 'LLM is running...'}
    except:
        logger.warning("LLM not reachable. Attempting to start ollama service")
        subprocess.Popen(["ollama", "serve"])
        time.sleep(3)
        logger.info("LLM startup command issued")
        return {'message': 'LLM is starting...'}

app.include_router(upload_router, prefix='/api')
app.include_router(gaps_router, prefix='/api')
app.include_router(revision_router, prefix='/api')
app.include_router(roadmap_router, prefix='/api')
app.include_router(storage_router, prefix='/api')


if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=5000)