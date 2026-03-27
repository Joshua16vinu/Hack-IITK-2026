import numpy as np
import ollama

from helpers.llm_helper import ensure_ollama_running


EMBEDDING_MODEL_NAME = "nomic-embed-text"


class OllamaEmbedder:
    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME):
        self.model_name = model_name

    def _embed_once(self, text: str):
        if hasattr(ollama, "embed"):
            response = ollama.embed(model=self.model_name, input=text)
            return response["embeddings"][0]

        response = ollama.embeddings(model=self.model_name, prompt=text)
        return response["embedding"]

    def encode(self, text: str):
        ensure_ollama_running()

        try:
            vector = self._embed_once(text)
        except Exception as exc:
            message = str(exc).lower()
            if "not found" not in message:
                raise

            print(f"Embedding model '{self.model_name}' not found. Pulling...")
            ollama.pull(self.model_name)
            vector = self._embed_once(text)

        return np.array(vector, dtype=float)


def load_embedding_model():
    print(f"Loading embedding model: {EMBEDDING_MODEL_NAME}...")
    return OllamaEmbedder()