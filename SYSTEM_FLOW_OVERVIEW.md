# PolicyGuard AI - Current System Flow Overview

## 1) System Purpose
PolicyGuard AI analyzes an uploaded policy PDF against NIST-aligned content, identifies compliance gaps, generates a revised policy, rechecks remaining gaps, and builds an implementation roadmap.

## 2) Architecture

### Frontend (React + Vite)
- Path: `src/`
- Router: React Router (`src/App.tsx`)
- Key routes:
  - `/` - upload + mode selection
  - `/analysis` - gap analysis progress/results
  - `/revised-policy` - revised policy generation + recheck
  - `/roadmap` - roadmap generation
  - `/nist-policies` - static reference page

### Backend (FastAPI)
- Path: `backend/`
- Entry point: `backend/main.py`
- API prefix: `/api`
- Mounted route modules:
  - `upload_route.py`
  - `gaps_route.py`
  - `revision_route.py`
  - `recheck_route.py`
  - `roadmap_route.py`

### AI and Retrieval
- Generation: Ollama local server (`http://localhost:11434`)
- Generation models:
  - `mistral`
  - `phi4-mini`
- Embeddings: `all-MiniLM-L6-v2` (local model directory)
- Vector store: local persistent ChromaDB in `backend/chroma_data/`
- Chroma collections:
  - `domain_kb`
  - `nist_controls`

## 3) Startup and Initialization

### 3.1 Backend startup (`backend/main.py`)
- Configures logging
- Enables permissive CORS
- Ensures upload folder exists (`backend/uploads`)

### 3.2 LLM availability checks
- `GET /check-llm` probes Ollama and attempts `ollama serve` if unavailable
- LLM helper also self-checks Ollama before each call

### 3.3 Embedding model provisioning
Run once if missing:
```bash
cd backend
python download_embedding_model.py
```

### 3.4 Ingestion (knowledge preparation)
```bash
cd backend
python -m ingestion.ingest_domain_data
python -m ingestion.ingest_nist
```

## 4) Knowledge Preparation Flow

### 4.1 Domain KB ingestion (`backend/ingestion/ingest_domain_data.py`)
1. Reads `backend/ingestion/domain_data.json`
2. Embeds domain support text
3. Upserts into `domain_kb` with domain metadata

### 4.2 NIST ingestion (`backend/ingestion/ingest_nist.py`)
1. Reads `backend/ingestion/chunks_of_nist.json`
2. Embeds each NIST chunk
3. Upserts into `nist_controls` with metadata

## 5) End-to-End Runtime Flow

## Step A - Upload and preprocess policy PDF
Frontend page: `/`

### Request
`POST /api/upload-pdf` (multipart form-data)
- `file` (required)
- `domain` (optional)

### Backend (`backend/routes/upload_route.py`)
1. Validates file presence and `.pdf` extension
2. Reads bytes and generates deterministic `file_id` (md5 + optional domain suffix)
3. Saves file into `backend/uploads/`
4. Extracts text via `helpers/pdf_helper.py`
5. Chunks text via token-aware sentence chunking (`helpers/chunking_helper.py`)
6. Branches by domain mode:
   - Manual domain selected:
     - batches chunks (`CHUNKS_PER_BATCH=3`)
     - tags all batches with selected domain
   - Auto domain mode:
     - classifies each chunk using hybrid score
     - semantic score (Chroma `domain_kb`) + keyword score (`domain_data.json`)
     - weighted combine (`0.7 semantic + 0.3 keyword`)
     - optional dual-domain assignment when top-score gap < threshold (`0.05`)
7. Retrieves related NIST snippets from `nist_controls` per domain group
8. Returns:
   - `file_id`
   - `result` (domain groups + related NIST policies)
   - `extracted_text`

### Frontend persistence after upload
Stores to `localStorage`:
- `uploadedDomains`
- `extractedText`
- `fileId`

Then navigates to `/analysis`.

## Step B - Gap analysis (async with polling)
Frontend page: `/analysis`

1. Reads `uploadedDomains` and `fileId` from `localStorage`
2. Starts job with `POST /api/analyze-gaps`
3. Polls `GET /api/analyze-gaps` every 15s
4. Caches progress/results in `localStorage` key `gapAnalysis:<fileId>`

### Backend (`backend/routes/gaps_route.py` + `backend/services/gaps_service.py`)
1. Uses global `current_job`
2. Rejects new start when status is `processing`
3. Background task iterates each domain entry
4. Formats org text + related NIST text
5. Calls LLM with `GAP_ANALYSIS_PROMPT`
6. Updates per-domain result status and `current_job` counters
7. Sets final job status to `completed` or `failed`

### Gap analysis model selection
- Mode `deep` -> `mistral`
- Mode `auto` or `rapid` -> `phi4-mini`

## Step C - Revised policy generation (streaming)
Frontend page: `/revised-policy`

1. Loads `extractedText` and `gapAnalysis:<fileId>`
2. Builds combined gap text (domain-wise)
3. Calls `POST /api/revised-policy`
4. Reads stream and appends content live
5. Stores final output in `localStorage` key `revisedPolicy:<fileId>`

### Backend (`backend/routes/revision_route.py`)
1. Validates non-empty `text` and `gap_analysis`
2. Formats revision prompt
3. Streams response via `helpers.llm_helper.stream_llm`

### Revised policy model selection
- Mode `rapid` -> `phi4-mini`
- Mode `auto` or `deep` -> `mistral`

## Step D - Recheck revised policy against gaps
Frontend page: `/revised-policy`

1. User triggers "Reanalyze Policy"
2. Calls `POST /api/recheck-policy` with revised policy + combined gaps
3. If `remaining_gaps` exist:
   - store in `localStorage` as `recheckGaps:<fileId>`
   - update combined gaps for regeneration
4. If no gaps:
   - show success state

### Backend (`backend/routes/recheck_route.py`)
1. Validates non-empty `revised_policy` and `gaps`
2. Calls non-stream LLM (`call_llm`) using recheck prompt
3. Normalizes varied LLM response formats into:
   - `{ "remaining_gaps": [...] }` or
   - `{ "message": "No more gaps found..." }`

### Recheck model selection and timeout
- Always model `phi4-mini`
- Mode `deep` -> no timeout
- Mode `auto` or `rapid` -> timeout=1s; timeout treated as no remaining gaps

## Step E - Roadmap generation (streaming)
Frontend page: `/roadmap`

1. Loads `extractedText` and `revisedPolicy:<fileId>`
2. Calls `POST /api/get-roadmap`
3. Reads stream progressively and renders live
4. Stores final output in `localStorage` key `roadmap:<fileId>`

### Backend (`backend/routes/roadmap_route.py`)
1. Validates `input_policy` and `revised_policy`
2. Formats roadmap prompt
3. Streams generated roadmap via `stream_llm`

### Roadmap model selection
- Mode `rapid` -> `phi4-mini`
- Mode `auto` or `deep` -> `mistral`

## 6) LLM Service Behavior (`backend/helpers/llm_helper.py`)

### Non-stream (`call_llm`)
1. Ensures Ollama server is reachable
2. Calls `/api/generate` with low temperature
3. Attempts to parse as JSON
4. If parse fails:
   - extract JSON fragments
   - attempt response repair prompt
   - fallback to raw text

### Stream (`stream_llm`)
1. Ensures Ollama is running
2. Uses `ollama.chat(..., stream=True)`
3. Yields partial content chunks

## 7) Data Persistence

### Backend persistence
- Uploaded files: `backend/uploads/`
- ChromaDB persistent store: `backend/chroma_data/`

### Frontend persistence (`localStorage`)
- `mode`
- `uploadedDomains`
- `extractedText`
- `fileId`
- `gapAnalysis:<fileId>`
- `revisedPolicy:<fileId>`
- `recheckGaps:<fileId>`
- `roadmap:<fileId>`

## 8) API Contracts (Current)

### `POST /api/upload-pdf`
Input:
- multipart: `file`, optional `domain`

Output:
```json
{
  "file_id": "string",
  "result": [
    {
      "domain": "string",
      "text": ["string"],
      "related_nist_policies": [
        { "id": "string", "content": "string" }
      ]
    }
  ],
  "extracted_text": "string"
}
```

### `POST /api/analyze-gaps`
Input:
```json
{
  "data": [
    {
      "domain": "string",
      "text": ["string"],
      "related_nist_policies": [
        { "id": "string", "content": "string" }
      ]
    }
  ],
  "mode": "auto | rapid | deep"
}
```

Output: current job snapshot (`status`, `results`, counters)

### `GET /api/analyze-gaps`
Output: latest global job state

### `POST /api/revised-policy`
Input:
```json
{
  "text": "string",
  "gap_analysis": "string",
  "mode": "auto | rapid | deep"
}
```
Output: streamed text

### `POST /api/recheck-policy`
Input:
```json
{
  "revised_policy": "string",
  "gaps": "string",
  "mode": "auto | rapid | deep"
}
```
Output:
```json
{ "remaining_gaps": ["..."] }
```
or
```json
{ "message": "No more gaps found..." }
```

### `POST /api/get-roadmap`
Input:
```json
{
  "input_policy": "string",
  "revised_policy": "string",
  "mode": "auto | rapid | deep"
}
```
Output: streamed text

## One-Line Summary
Upload PDF -> extract/chunk/classify -> retrieve NIST context -> run polled gap analysis -> stream revised policy -> recheck remaining gaps -> stream roadmap, with key outputs cached in browser localStorage.
