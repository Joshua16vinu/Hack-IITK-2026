import json
import chromadb
import os

from constants import BACKEND_BASE_DIR
from embeddings.helper import load_embedding_model


JSON_PATH = BACKEND_BASE_DIR / "embeddings" / "chunks_of_nist.json"

COLLECTION_NAME = "nist_controls"


# -------- Init ChromaDB --------
print("Initializing ChromaDB HTTP client...")
client = chromadb.HttpClient(host="localhost", port="8000")
collection = client.get_or_create_collection(name=COLLECTION_NAME)

# -------- Safety check --------
if collection.count() > 0:
    print("Chroma collection already has data. Skipping ingestion.")
    exit()

# -------- Load JSON --------
print("Loading JSON...")
with open(JSON_PATH, "r", encoding="utf-8") as f:
    nist_data = json.load(f)

# -------- Load embedding model --------
print("Loading embedding model...")
embedder = load_embedding_model()

# -------- Embed & store --------
print("🔄 Creating embeddings and storing...")
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

print("NIST embeddings stored successfully.")
