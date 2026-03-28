from sentence_transformers import SentenceTransformer
from constants import EMBEDDING_MODEL_PATH

if __name__ == "__main__":
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    model.save(EMBEDDING_MODEL_PATH)
    print("Model downloaded and saved locally")