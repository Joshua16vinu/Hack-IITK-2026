from constants import EMBEDDING_MODEL_PATH

from sentence_transformers import SentenceTransformer

def load_embedding_model():
    print(f"Loading embedding model from: {EMBEDDING_MODEL_PATH}...")
    return SentenceTransformer(EMBEDDING_MODEL_PATH)
