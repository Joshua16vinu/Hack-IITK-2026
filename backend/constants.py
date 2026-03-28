import os

BACKEND_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BACKEND_BASE_DIR, "uploads")
LOG_FOLDER = os.path.join(BACKEND_BASE_DIR, "logs")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

MODEL_NAME = "mistral"


EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_MODEL_PATH = os.path.join(BACKEND_BASE_DIR, "models", EMBEDDING_MODEL_NAME)