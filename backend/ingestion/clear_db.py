from helpers.chroma_helper import get_chroma_client, stats_chroma_collection, delete_chroma_collection
from constants import NIST_COLLECTION_NAME, KB_COLLECTION_NAME, KEYWORDS_COLLECTION_NAME

def clear_chroma_collection(collection_name):
    client = get_chroma_client()
    count = stats_chroma_collection(client, collection_name)
    if count > 0:
        print("Collection %s has data. Deleting collection to clear data.", collection_name)
        delete_chroma_collection(client, collection_name)
    else:
        print("Collection %s is already empty. No action needed.", collection_name)
    
    
if __name__ == "__main__":
    clear_chroma_collection(NIST_COLLECTION_NAME)
    # clear_chroma_collection(KB_COLLECTION_NAME)
    # clear_chroma_collection(KEYWORDS_COLLECTION_NAME)