import chromadb
from chromadb.config import Settings

from constants import CHROMA_DB_PATH


def get_chroma_client():
    print("Initializing local ChromaDB client at:", CHROMA_DB_PATH)

    client = chromadb.Client(
        Settings(
            persist_directory=str(CHROMA_DB_PATH),
            anonymized_telemetry=False,
            is_persistent=True
        )
    )

    return client


def delete_chroma_collection(client, collection_name):
    print("Deleting collection:", collection_name)

    client.delete_collection(name=collection_name)

    print("Collection", collection_name, "deleted successfully")