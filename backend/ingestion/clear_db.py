from helpers.chroma_helper import get_chroma_client, delete_chroma_collection
from constants import NIST_COLLECTION, KB_COLLECTION

def clear_chroma_collection(collection_name):
    client = get_chroma_client()
    collection = client.get_or_create_collection(collection_name)
    count = collection.count()
    
    if count > 0:
        print("Collection", collection_name, "has data. Deleting collection to clear data.")
        delete_chroma_collection(client, collection_name)
    else:
        print("Collection", collection_name, "is already empty. No action needed.")
    
if __name__ == "__main__":
    clear_chroma_collection(NIST_COLLECTION)
    clear_chroma_collection(KB_COLLECTION)