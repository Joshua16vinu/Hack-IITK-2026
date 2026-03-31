from chromadb import HttpClient

def get_chroma_client():
    print("Initializing ChromaDB HTTP client")
    client = HttpClient(host="localhost", port="8000")
    
    collections = client.list_collections()
    print("Existing collections in ChromaDB:")
    for c in collections:
        print(c.name)
        
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
    client.delete_collection(collection_name)
    print("Collection", collection_name, "deleted successfully")