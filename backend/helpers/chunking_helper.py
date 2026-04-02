import re
from transformers import AutoTokenizer
from constants import EMBEDDING_MODEL_PATH, MIN_CHUNK_SIZE, MAX_CHUNK_SIZE, CHUNK_OVERLAP

tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_PATH)

def sentence_based_chunking(text):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    token_counts = [len(tokenizer.tokenize(sentence)) for sentence in sentences]

    chunks = []
    i = 0

    while i < len(sentences):
        chunk_sentences = []
        chunk_tokens = 0
        start_i = i

        # ---------------- Build Chunk ----------------
        while i < len(sentences):
            print(f"Evaluating sentence {i}: '{sentences[i][:50]}...' with {token_counts[i]} tokens")

            sentence_tokens = token_counts[i]

            is_oversized_single = not chunk_sentences and sentence_tokens > MAX_CHUNK_SIZE
            if is_oversized_single:
                chunk_sentences.append(sentences[i])
                chunk_tokens = sentence_tokens
                i += 1
                break

            if chunk_tokens + sentence_tokens > MAX_CHUNK_SIZE:
                break

            chunk_sentences.append(sentences[i])
            chunk_tokens += sentence_tokens
            i += 1

        if not chunk_sentences:
            break

        # ---------------- Ensure MIN size ----------------
        while chunk_tokens < MIN_CHUNK_SIZE and i < len(sentences):
            chunk_sentences.append(sentences[i])
            chunk_tokens += token_counts[i]
            i += 1

        chunks.append(" ".join(chunk_sentences))

        # ---------------- Overlap Logic ----------------
        if i < len(sentences) and CHUNK_OVERLAP > 0:
            overlap_tokens = 0
            overlap_cursor = i - 1

            # ✅ SAFE overlap (prevents too large backward jump)
            effective_overlap = min(CHUNK_OVERLAP, chunk_tokens // 2)

            while (
                overlap_cursor >= start_i
                and overlap_tokens < effective_overlap
            ):
                overlap_tokens += token_counts[overlap_cursor]
                overlap_cursor -= 1

            new_i = overlap_cursor + 1

            
            if new_i <= start_i:
                i = start_i + 1
            else:
                i = new_i

    return chunks