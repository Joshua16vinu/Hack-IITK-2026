from constants import EMBEDDING_MODEL_PATH

from sentence_transformers import SentenceTransformer

def load_embedding_model():
    return SentenceTransformer(EMBEDDING_MODEL_PATH)
