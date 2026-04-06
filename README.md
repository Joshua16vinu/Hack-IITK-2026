# PolicyGuard AI

React + Vite frontend and FastAPI backend for policy analysis against NIST guidance.

## What It Does
1. Upload an organization policy PDF.
2. Extract and chunk text.
3. Classify chunks by domain (auto) or force a selected domain (manual).
4. Retrieve related NIST chunks from local ChromaDB.
5. Run gap analysis.
6. Generate a revised policy (streamed).
7. Recheck the revised policy for remaining gaps.
8. Generate an implementation roadmap (streamed).

## Tech Stack
- Frontend: React 19, TypeScript, Vite, React Router, Tailwind CSS
- Backend: FastAPI, Ollama, SentenceTransformers, ChromaDB (local persistent)
- Models:
  - `mistral`
  - `phi4-mini`
  - `all-MiniLM-L6-v2` (local embedding model in `backend/models/`)

## Prerequisites
- Python 3.10+
- Node.js 20+ (or Bun)
- Ollama installed

## 1) Ollama Setup
Install and start Ollama, then pull required models.

```bash
# install (Linux/macOS)
curl -fsSL https://ollama.com/install.sh | sh

# start server
ollama serve

# pull generation models used by this project
ollama pull mistral
ollama pull phi4-mini
```

## 2) Backend Setup
From project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Download embedding model locally:

```bash
python download_embedding_model.py
```

Run ingestion once (or whenever source ingestion files change):

```bash
python -m ingestion.ingest_domain_data
python -m ingestion.ingest_nist
```

Run FastAPI server:

```bash
uvicorn main:app --reload
```

Backend base URL:
- `http://localhost:8000`

## 3) Frontend Setup
From project root (new terminal):

```bash
# with Bun
bun install
bun dev

# or with npm
# npm install
# npm run dev
```

Frontend dev URL (default Vite):
- `http://localhost:5173`

## Runtime Flow (Current)
### A. Upload
- Endpoint: `POST /api/upload-pdf`
- Request: multipart form-data
  - `file` (required PDF)
  - `domain` (optional)
- Response:
  - `file_id`
  - `result` (domain grouped text + related NIST policies)
  - `extracted_text`

Behavior:
- If `domain` is provided, chunks are batched and assigned to that domain.
- If `domain` is omitted, chunk classification uses hybrid scoring:
  - semantic similarity from `domain_kb`
  - keyword scoring from `ingestion/domain_data.json`
- Related NIST snippets are fetched from `nist_controls` collection.

### B. Gap Analysis
- Start: `POST /api/analyze-gaps`
- Poll: `GET /api/analyze-gaps`

Request body:
```json
{
  "data": [
    {
      "domain": "ISMS",
      "text": ["..."],
      "related_nist_policies": [{ "id": "...", "content": "..." }]
    }
  ],
  "mode": "auto | rapid | deep"
}
```

Mode behavior in gap analysis service:
- `deep` -> `mistral`
- `auto` / `rapid` -> `phi4-mini`

### C. Revised Policy (Streaming)
- Endpoint: `POST /api/revised-policy`
- Request:
```json
{
  "text": "original policy text",
  "gap_analysis": "combined gaps text",
  "mode": "auto | rapid | deep"
}
```

Mode behavior:
- `rapid` -> `phi4-mini`
- `auto` / `deep` -> `mistral`

### D. Recheck Revised Policy
- Endpoint: `POST /api/recheck-policy`
- Request:
```json
{
  "revised_policy": "...",
  "gaps": "...",
  "mode": "auto | rapid | deep"
}
```

Mode behavior:
- `auto` / `rapid` / `deep` -> `phi4-mini`

### E. Roadmap (Streaming)
- Endpoint: `POST /api/get-roadmap`
- Request:
```json
{
  "input_policy": "...",
  "revised_policy": "...",
  "mode": "auto | rapid | deep"
}
```

Mode behavior:
- `rapid` -> `phi4-mini`
- `auto` / `deep` -> `mistral`

## Client-Side Persistence
The frontend stores workflow state in `localStorage`:
- `mode`
- `uploadedDomains`
- `extractedText`
- `fileId`
- `gapAnalysis:<fileId>`
- `revisedPolicy:<fileId>`
- `recheckGaps:<fileId>`
- `roadmap:<fileId>`

## Quick Health Checks
```bash
# Ollama service + models
ollama list

# backend root health
curl http://localhost:8000/

# app LLM check route
curl http://localhost:8000/check-llm
```

## Project Structure (Top Level)
- `src/` - React frontend
- `backend/` - FastAPI backend and AI pipeline
- `backend/routes/` - API endpoints
- `backend/services/` - chunking/classification/gap processing logic
- `backend/helpers/` - PDF, LLM, embeddings, Chroma helpers
- `backend/ingestion/` - domain and NIST ingestion scripts/data