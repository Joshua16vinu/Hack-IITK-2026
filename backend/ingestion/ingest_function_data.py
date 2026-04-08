import json
from pathlib import Path

from constants import BACKEND_BASE_DIR, FUNCTION_COLLECTION
from helpers.embedding_helper import load_embedding_model
from helpers.chroma_helper import get_chroma_client

JSON_PATH = Path(BACKEND_BASE_DIR) / "ingestion" / "function_data.json"

client = get_chroma_client()
collection = client.get_or_create_collection(name=FUNCTION_COLLECTION)

if collection.count() > 0:
    print("Collection already has data. Skipping ingestion.")
    exit()

with open(JSON_PATH, "r", encoding="utf-8") as f:
    domain_data = json.load(f)

embedder = load_embedding_model()

ids, documents, embeddings, metadatas = [], [], [], []

for item in domain_data:
    domain = item["domain"]
    function = item["function"]
    label = item["sub-function"]
    phrases = item["kb"]
    phrase_embeddings = embedder.encode(phrases, normalize_embeddings=True)

    for idx, (phrase, embedding) in enumerate(zip(phrases, phrase_embeddings)):
        ids.append(f"{domain}_{label}_{idx}")
        documents.append(phrase)
        embeddings.append(embedding.tolist())
        metadatas.append({"domain": domain, 
                          "function": function,
                          "label": label})

collection.upsert(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)
print(f"Stored {len(ids)} embeddings successfully.")