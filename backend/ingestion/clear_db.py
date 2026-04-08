from helpers.chroma_helper import get_chroma_client, delete_chroma_collection
from constants import NIST_COLLECTION, DOMAIN_COLLECTION, FUNCTION_COLLECTION

def clear_chroma_collection(client, collection_name):
    collection = client.get_or_create_collection(collection_name)
    count = collection.count()
    
    if count > 0:
        print("Collection", collection_name, "has data. Deleting collection to clear data.")
        delete_chroma_collection(client, collection_name)
    else:
        print("Collection", collection_name, "is already empty. No action needed.")
    
if __name__ == "__main__":
    client = get_chroma_client()
    
    # clear_chroma_collection(client, NIST_COLLECTION)
    # clear_chroma_collection(client, DOMAIN_COLLECTION)
    clear_chroma_collection(client, FUNCTION_COLLECTION)