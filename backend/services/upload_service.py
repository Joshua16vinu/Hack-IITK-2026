import json
from pathlib import Path
from collections import defaultdict

from constants import DOMAIN_DATA_PATH, FUNCTION_DATA_PATH, DOMAIN_COLLECTION, FUNCTION_COLLECTION, NIST_COLLECTION, NIST_PER_CHUNK, SEMANTIC_WEIGHT, KEYWORD_WEIGHT, DOMAIN_GAP_THRESHOLD, CHUNKS_PER_BATCH
from helpers.chroma_helper import get_chroma_client
from helpers.embedding_helper import load_embedding_model

embedder = load_embedding_model()


# -------------------------------- Batching chunks if domain is specified --------------------------------
def batch_chunks(chunks: list, batch_size: int = CHUNKS_PER_BATCH) -> list:
    """Split chunks into balanced batches."""
    if not chunks:
        return []
    
    num_chunks = len(chunks)
    if num_chunks <= batch_size:
        num_batches = 1
    elif num_chunks <= (batch_size * 2) + 1:
        num_batches = 2
    elif num_chunks <= (batch_size * 3) + 2:
        num_batches = 3
    else:
        num_batches = (num_chunks + batch_size - 1) // batch_size
    
    base_size = num_chunks // num_batches
    remainder = num_chunks % num_batches
    
    batches = []
    start = 0
    for i in range(num_batches):
        size = base_size + (1 if i >= num_batches - remainder else 0)
        batches.append(chunks[start:start + size])
        start += size
    
    return batches

# -------------------------------- Domain classification logic --------------------------------
with open(Path(DOMAIN_DATA_PATH), "r") as f:
    DOMAIN_KEYWORDS = {entry["domain"]: entry["keywords"] for entry in json.load(f)}

with open(Path(FUNCTION_DATA_PATH), "r") as f:
    _FUNCTION_DATA = json.load(f)

FUNCTION_KNOWLEDGE_BY_DOMAIN = defaultdict(list)
for entry in _FUNCTION_DATA:
    FUNCTION_KNOWLEDGE_BY_DOMAIN[entry["domain"]].append(entry)

client = get_chroma_client()
_domain_kb_collection = client.get_or_create_collection(DOMAIN_COLLECTION)
_function_kb_collection = client.get_or_create_collection(FUNCTION_COLLECTION)
_nist_collection = client.get_or_create_collection(NIST_COLLECTION)


def _semantic_scores(chunk_embedding: list[float]) -> dict[str, float]:
    results = _domain_kb_collection.query(query_embeddings=[chunk_embedding], n_results=10, include=["metadatas", "distances"])
    domain_similarities = defaultdict(list)
    for metadata, distance in zip(results["metadatas"][0], results["distances"][0]):
        domain_similarities[metadata["domain"]].append(1 - distance)
    return {domain: max(sims) for domain, sims in domain_similarities.items()}


def _keyword_score(text: str, keywords: list[str]) -> float:
    if not keywords:
        return 0.0

    text_lower = text.lower()
    return sum(1 for kw in keywords if kw in text_lower) / len(keywords)


def _function_semantic_scores(chunk_embedding: list[float], domain: str) -> dict[str, float]:
    results = _function_kb_collection.query(
        query_embeddings=[chunk_embedding],
        n_results=20,
        include=["metadatas", "distances"],
        where={"domain": domain}
    )

    function_similarities = defaultdict(list)
    for metadata, distance in zip(results["metadatas"][0], results["distances"][0]):
        sub_function = metadata["label"]
        function_similarities[sub_function].append(1 - distance)

    return {sub_function: max(sims) for sub_function, sims in function_similarities.items()}


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


def classify_top_function_for_domain(text: str, domain: str) -> dict | None:
    function_candidates = FUNCTION_KNOWLEDGE_BY_DOMAIN.get(domain, [])
    if not function_candidates:
        return None

    text_embedding = embedder.encode(text, normalize_embeddings=True).tolist()
    semantic_scores = _function_semantic_scores(text_embedding, domain)

    keyword_scores = {
        entry["sub-function"]: _keyword_score(text, entry.get("keywords", []))
        for entry in function_candidates
    }

    all_sub_functions = set(semantic_scores) | set(keyword_scores)
    combined_scores = {
        sub_function: round(
            SEMANTIC_WEIGHT * semantic_scores.get(sub_function, 0.0)
            + KEYWORD_WEIGHT * keyword_scores.get(sub_function, 0.0),
            4,
        )
        for sub_function in all_sub_functions
    }

    if not combined_scores:
        return None

    top_sub_function, top_score = max(combined_scores.items(), key=lambda x: x[1])
    top_entry = next(
        (entry for entry in function_candidates if entry["sub-function"] == top_sub_function),
        None,
    )

    if not top_entry:
        return None

    return {
        "domain": domain,
        "function": top_entry["function"],
        "sub_function": top_entry["sub-function"],
        "sub_function_label": top_entry.get("sub-function-label", ""),
        "policy_templates": top_entry.get("policy_templates", []),
    }
    


# -------------------------------- Restructure chunks by domain --------------------------------
def restructure_chunks_by_domain(classified_chunks: list[dict]) -> list[dict]:
    domain_text_map = {}

    for item in classified_chunks:
        for domain in item["domains"]:
            domain_text_map.setdefault(domain, []).append(item["chunk"])

    # Only include domains that have enough chunks to form a batch
    return [
        {
            "domain": domain,
            "text": texts,
            "related_nist_policies": [],
        }
        for domain, texts in domain_text_map.items()
        if len(texts) >= 1
    ]


# -------------------------------- Get domain chunks with policies --------------------------------
def get_domain_chunks_with_policies(domain_chunks: list[dict]) -> list[dict]:
    for item in domain_chunks:
        chunk_texts = item["text"] if isinstance(item["text"], list) else [str(item["text"])]

        chunk_level_functions = []
        all_functions = []
        all_sub_functions = []
        all_sub_function_labels = []
        all_sub_function_pairs = []
        cumulative_policy_templates = []

        for chunk_text in chunk_texts:
            top_function = classify_top_function_for_domain(chunk_text, item["domain"])
            if not top_function:
                continue

            chunk_level_functions.append(top_function)

            function_name = top_function.get("function")
            sub_function = top_function.get("sub_function")
            sub_function_label = top_function.get("sub_function_label")
            policy_templates = top_function.get("policy_templates", [])

            if function_name and function_name not in all_functions:
                all_functions.append(function_name)
            if sub_function and sub_function not in all_sub_functions:
                all_sub_functions.append(sub_function)
            if sub_function_label and sub_function_label not in all_sub_function_labels:
                all_sub_function_labels.append(sub_function_label)
            if sub_function and sub_function_label:
                pair = (sub_function_label, sub_function)
                if pair not in all_sub_function_pairs:
                    all_sub_function_pairs.append(pair)
            for policy_template in policy_templates:
                if policy_template not in cumulative_policy_templates:
                    cumulative_policy_templates.append(policy_template)

        merged_text = "\n\n".join(chunk_texts)
        domain_top_function = classify_top_function_for_domain(merged_text, item["domain"])

        if domain_top_function:
            top_function_name = domain_top_function.get("function")
            if top_function_name and top_function_name not in all_functions:
                all_functions.append(top_function_name)

        chunk_embeddings = embedder.encode(chunk_texts, normalize_embeddings=True).tolist()

        query_kwargs = {
            "query_embeddings": chunk_embeddings,
            "n_results": NIST_PER_CHUNK,
            "include": ["documents", "metadatas"],
        }

        if cumulative_policy_templates:
            query_kwargs["where"] = {"policy_templates": {"$in": cumulative_policy_templates}}

        results = _nist_collection.query(**query_kwargs)

        seen_ids = set()
        unique_policies = []

        for ids, documents, metadatas in zip(results["ids"], results["documents"], results["metadatas"]):
            for doc_id, doc, metadata in zip(ids, documents, metadatas):
                if doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    unique_policies.append({
                        "id": doc_id,
                        "content": doc,
                        "policy_template": metadata.get("policy_templates") if isinstance(metadata, dict) else None,
                    })

        item["related_nist_policies"] = unique_policies

        retrieved_sub_functions = [
            f"{label} ({sub_function})"
            for label, sub_function in all_sub_function_pairs
        ]

        item["retrieved_from"] = {
            "functions": all_functions,
            "sub_functions": retrieved_sub_functions,
            "policy_templates": cumulative_policy_templates,
        }

    return domain_chunks