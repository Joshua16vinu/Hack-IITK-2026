import os

BACKEND_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DB_PATH = os.path.join(BACKEND_BASE_DIR, "chroma_data")
UPLOAD_FOLDER = os.path.join(BACKEND_BASE_DIR, "uploads")
LOG_FOLDER = os.path.join(BACKEND_BASE_DIR, "logs")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB


MODEL_NAME = "mistral"


EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_MODEL_PATH = os.path.join(BACKEND_BASE_DIR, "models", EMBEDDING_MODEL_NAME)

CHUNKS_PER_BATCH = 3
NIST_PER_CHUNK = 3

MIN_CHUNK_SIZE = 150
MAX_CHUNK_SIZE = 250
CHUNK_OVERLAP = 30


NIST_COLLECTION = "nist_controls"
KB_COLLECTION = "domain_kb"

SEMANTIC_WEIGHT = 0.7
KEYWORD_WEIGHT = 0.3
DOMAIN_GAP_THRESHOLD = 0.05
DOMAIN_DATA_PATH = os.path.join(BACKEND_BASE_DIR, "ingestion", "domain_data.json")