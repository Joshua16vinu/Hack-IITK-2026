import os

BACKEND_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BACKEND_BASE_DIR, "uploads")
LOG_FOLDER = os.path.join(BACKEND_BASE_DIR, "logs")
STORAGE_FOLDER = os.path.join(BACKEND_BASE_DIR, "storage")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB


MODEL_NAME = "mistral"


EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_MODEL_PATH = os.path.join(BACKEND_BASE_DIR, "models", EMBEDDING_MODEL_NAME)

MIN_CHUNK_SIZE = 150
MAX_CHUNK_SIZE = 250
CHUNK_OVERLAP = 50


NIST_COLLECTION = "nist_controls"
KB_COLLECTION = "domain_kb"

SEMANTIC_WEIGHT = 0.6
KEYWORD_WEIGHT = 0.4
DOMAIN_GAP_THRESHOLD = 0.05
DOMAIN_DATA_PATH = os.path.join(BACKEND_BASE_DIR, "ingestion", "domain_data.json")