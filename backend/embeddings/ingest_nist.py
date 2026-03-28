import json
import chromadb
from pathlib import Path

from constants import BACKEND_BASE_DIR
from helpers.embedding_helper import load_embedding_model
from helpers.logger import setup_logging, get_logger


setup_logging()
logger = get_logger(__name__)


JSON_PATH = Path(BACKEND_BASE_DIR) / "embeddings" / "chunks_of_nist.json"

COLLECTION_NAME = "nist_controls"


# -------- Init ChromaDB --------
logger.info("Initializing ChromaDB HTTP client")
client = chromadb.HttpClient(host="localhost", port="8000")
collection = client.get_or_create_collection(name=COLLECTION_NAME)

# -------- Safety check --------
if collection.count() > 0:
    logger.info("Chroma collection already has data. Skipping ingestion")
    exit()

# -------- Load JSON --------
logger.info("Loading NIST chunk JSON from %s", JSON_PATH)
with open(JSON_PATH, "r", encoding="utf-8") as f:
    nist_data = json.load(f)

# -------- Load embedding model --------
logger.info("Loading embedding model")
embedder = load_embedding_model()

# -------- Embed & store --------
logger.info("Creating embeddings and storing in collection: %s", COLLECTION_NAME)
for item in nist_data:
    embedding = embedder.encode(item["text"]).tolist()

    collection.add(
        ids=[item["id"]],
        documents=[item["text"]],
        metadatas=[{
            "domain": item.get("domain"),
            "subdomain": item.get("subdomain"),
            "source": item.get("source")
        }],
        embeddings=[embedding]
    )

logger.info("NIST embeddings stored successfully")
