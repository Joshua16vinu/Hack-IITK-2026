import json
import chromadb
from pathlib import Path

from constants import BACKEND_BASE_DIR, NIST_COLLECTION
from helpers.embedding_helper import load_embedding_model
from helpers.chroma_helper import get_chroma_client

JSON_PATH = Path(BACKEND_BASE_DIR) / "ingestion" / "chunks_of_nist.json"


# -------- Init ChromaDB --------
client = get_chroma_client()
collection = client.get_or_create_collection(name=NIST_COLLECTION)

# -------- Safety check --------
if collection.count() > 0:
    print("Chroma collection already has data. Skipping ingestion")
    exit()

# -------- Load JSON --------
print("Loading NIST chunk JSON from", JSON_PATH)
with open(JSON_PATH, "r", encoding="utf-8") as f:
    nist_data = json.load(f)

# -------- Load embedding model --------
print("Loading embedding model")
embedder = load_embedding_model()

# -------- Embed & store --------
print("Creating embeddings and storing in collection:", NIST_COLLECTION)
for item in nist_data:
    embedding = embedder.encode(item["text"]).tolist()

    collection.upsert(
        ids=[item["id"]],
        documents=[item["text"]],
        metadatas=[{
            "policy_templates": item.get("policy_templates"),
            "source": item.get("source")
        }],
        embeddings=[embedding]
    )

print("NIST embeddings stored successfully")
