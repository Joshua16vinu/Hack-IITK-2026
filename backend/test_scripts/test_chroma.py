from helpers.chroma_helper import get_chroma_client

if __name__ == "__main__":
    client = get_chroma_client()
    print("Connected to ChromaDB successfully!")
    
    # List existing collections
    collections = client.list_collections()
    print("Existing collections:", [col.name for col in collections])
    
    for col in collections:
        count = col.count()
        print(f"Collection '{col.name}' has {count} items.")