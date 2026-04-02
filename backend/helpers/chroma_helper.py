import chromadb
from chromadb.config import Settings
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
DB_PATH = BASE_DIR / "chroma_data"


def get_chroma_client():
    print("Initializing LOCAL ChromaDB client at:", DB_PATH)

    client = chromadb.Client(
        Settings(
            persist_directory=str(DB_PATH),   # ✅ absolute path
            anonymized_telemetry=False,
            is_persistent=True
        )
    )

    return client

def get_chroma_collection(client, collection_name):
    print("Getting collection:", collection_name)

    collection = client.get_or_create_collection(name=collection_name)

    return collection


def stats_chroma_collection(client, collection_name):
    collection = get_chroma_collection(client, collection_name)

    count = collection.count()
    print("Collection", collection_name, "has", count, "items")

    return count


def delete_chroma_collection(client, collection_name):
    print("Deleting collection:", collection_name)

    client.delete_collection(name=collection_name)

    print("Collection", collection_name, "deleted successfully")