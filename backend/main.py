from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import requests
import time
import os
import uvicorn

from constants import UPLOAD_FOLDER
from routes.upload_route import upload_router


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

@app.get('/')
async def health_check():
    return {'message': 'Backend is running...'}

@app.get('/check-llm')
async def check_llm():
    try:
        requests.get("http://localhost:11434")
        return {'message': 'LLM is running...'}
    except:
        subprocess.Popen(["ollama", "serve"])
        time.sleep(3)
        return {'message': 'LLM is starting...'}

app.include_router(upload_router, prefix='/api')


if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=5000)