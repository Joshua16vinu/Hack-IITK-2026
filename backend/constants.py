import os

BACKEND_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BACKEND_BASE_DIR, "uploads")
LOG_FOLDER = os.path.join(BACKEND_BASE_DIR, "logs")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB


MODEL_NAME = "mistral"


EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_MODEL_PATH = os.path.join(BACKEND_BASE_DIR, "models", EMBEDDING_MODEL_NAME)

MIN_CHUNK_SIZE = 150
MAX_CHUNK_SIZE = 250
CHUNK_OVERLAP = 50


NIST_COLLECTION_NAME = "nist_controls"
KB_COLLECTION_NAME = "domain_kb"
KEYWORDS_COLLECTION_NAME = "domain_keywords"