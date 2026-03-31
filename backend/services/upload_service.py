import json
from pathlib import Path
from collections import defaultdict

from constants import DOMAIN_DATA_PATH, KB_COLLECTION, NIST_COLLECTION, SEMANTIC_WEIGHT, KEYWORD_WEIGHT, DOMAIN_GAP_THRESHOLD
from helpers.chroma_helper import get_chroma_client
from helpers.embedding_helper import load_embedding_model

embedder = load_embedding_model()


# -------------------------------- Domain classification logic --------------------------------
with open(Path(DOMAIN_DATA_PATH), "r") as f:
    DOMAIN_KEYWORDS = {entry["domain"]: entry["keywords"] for entry in json.load(f)}

_kb_collection = get_chroma_client().get_collection(KB_COLLECTION)
_nist_collection = get_chroma_client().get_collection(NIST_COLLECTION)


def _semantic_scores(chunk_embedding: list[float]) -> dict[str, float]:
    results = _kb_collection.query(query_embeddings=[chunk_embedding], n_results=10, include=["metadatas", "distances"])
    domain_similarities = defaultdict(list)
    for metadata, distance in zip(results["metadatas"][0], results["distances"][0]):
        domain_similarities[metadata["domain"]].append(1 - distance)
    return {domain: max(sims) for domain, sims in domain_similarities.items()}


def _keyword_score(text: str, keywords: list[str]) -> float:
    text_lower = text.lower()
    return sum(1 for kw in keywords if kw in text_lower) / len(keywords)


def classify_pdf_chunk(chunk: str) -> dict:
    chunk_embedding = embedder.encode(chunk, normalize_embeddings=True).tolist()

    semantic_scores = _semantic_scores(chunk_embedding)
    keyword_scores = {domain: _keyword_score(chunk, kws) for domain, kws in DOMAIN_KEYWORDS.items()}

    all_domains = set(semantic_scores) | set(keyword_scores)
    combined_scores = {
        domain: round(SEMANTIC_WEIGHT * semantic_scores.get(domain, 0.0) + KEYWORD_WEIGHT * keyword_scores.get(domain, 0.0), 4)
        for domain in all_domains
    }

    sorted_domains = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
    top1, top2 = sorted_domains[0], sorted_domains[1]

    return {
        "chunk": chunk,
        "domains": [top1[0], top2[0]] if (top1[1] - top2[1]) < DOMAIN_GAP_THRESHOLD else [top1[0]],
        "scores": combined_scores,
        "top_scores": {"top1": top1, "top2": top2},
    }
    


# -------------------------------- Restructure chunks by domain --------------------------------
def restructure_chunks_by_domain(classified_chunks: list[dict]) -> list[dict]:
    domain_text_map = {}

    for item in classified_chunks:
        for domain in item["domains"]:
            domain_text_map.setdefault(domain, []).append(item["chunk"])

    return [{"domain": domain, "text": texts, "related_nist_policies": []} for domain, texts in domain_text_map.items()]


# -------------------------------- Get domain chunks with policies --------------------------------
def get_domain_chunks_with_policies(domain_chunks: list[dict]) -> list[dict]:
    for item in domain_chunks:
        chunk_embeddings = embedder.encode(item["text"], normalize_embeddings=True).tolist()

        results = _nist_collection.query(
            query_embeddings=chunk_embeddings,
            n_results=5,
            include=["documents"],
            where={"domain": item["domain"]}
        )

        seen_ids = set()
        unique_policies = []

        for ids, documents in zip(results["ids"], results["documents"]):
            for doc_id, doc in zip(ids, documents):
                if doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    unique_policies.append(doc)

        item["related_nist_policies"] = unique_policies

    return domain_chunks