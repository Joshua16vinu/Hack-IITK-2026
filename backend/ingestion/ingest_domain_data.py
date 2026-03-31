import json
from pathlib import Path

from constants import BACKEND_BASE_DIR, KB_COLLECTION_NAME, KEYWORDS_COLLECTION_NAME
from helpers.embedding_helper import load_embedding_model
from helpers.chroma_helper import get_chroma_client

JSON_PATH = Path(BACKEND_BASE_DIR) / "ingestion" / "domain_data.json"


def ingest_collection(collection_name: str, domain_data: list, embedder, phrase_key: str):
    client = get_chroma_client()
    collection = client.get_or_create_collection(name=collection_name)

    if collection.count() > 0:
        print(f"[{collection_name}] Already has data. Skipping ingestion.")
        return

    ids, documents, embeddings, metadatas = [], [], [], []

    for item in domain_data:
        domain = item["domain"]
        phrases = item[phrase_key]
        phrase_embeddings = embedder.encode(phrases, normalize_embeddings=True)

        for idx, (phrase, embedding) in enumerate(zip(phrases, phrase_embeddings)):
            ids.append(f"{collection_name}__{domain}__{idx}")
            documents.append(phrase)
            embeddings.append(embedding.tolist())
            metadatas.append({"domain": domain})

    collection.upsert(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)
    print(f"[{collection_name}] Stored {len(ids)} embeddings successfully.")


if __name__ == "__main__":
    print(f"Loading domain data from {JSON_PATH}")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        domain_data = json.load(f)

    print("Loading embedding model...")
    embedder = load_embedding_model()

    ingest_collection(KB_COLLECTION_NAME, domain_data, embedder, phrase_key="kb")
    ingest_collection(KEYWORDS_COLLECTION_NAME, domain_data, embedder, phrase_key="keywords")