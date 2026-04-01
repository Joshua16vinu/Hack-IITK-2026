# PolicyGuard AI

A Next.js frontend and FastAPI backend system for Policy Analysis using LLMs.

## Features
- **Modern UI**: Premium dark mode design with glassmorphism and animations.
- **Drag & Drop Upload**: Easy file handling.
- **Real-time Progress**: Visual feedback during analysis.
- **Interactive Report**: Collapsible sections for Gap Analysis, Revised Policy, and Roadmap.

## Prerequisites
- Bun installed
- Python 3.8+ installed
- Ollama installed and running (for local LLM support)

## Setup & Running the Application

Please follow these steps in order to start the application.

### 1. Ollama Setup
1. Download and install [Ollama](https://ollama.com/download).
2. Start the Ollama server:
   ```bash
   ollama serve
   ```
3. Pull the required LLM model:
   ```bash
   ollama pull mistral
   ```

### 2. Backend Setup
1. Open a new terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Download the local embedding model:
   ```bash
   python download_embedding_model.py
   ```
   *This downloads `all-MiniLM-L6-v2` into `backend/models/` for embedding generation.*

5. Start ChromaDB (in a separate terminal with venv activated):
   ```bash
   source venv/bin/activate  # Make sure venv is activated
   chroma run --host 0.0.0.0 --port 8000 --path ./chroma_data
   ```
   *ChromaDB will now be running on `http://127.0.0.1:8000`.*

6. Run ChromaDB ingestion to populate the database:
   ```bash
   # Ingest NIST data
   python -m ingestion.ingest_nist
   
   # Ingest domain-specific data
   python -m ingestion.ingest_domain_data
   ```

7. Start the FastAPI backend server (in the original backend terminal):
   ```bash
   uvicorn main:app --port 5000 --reload
   ```
   *The backend will now be running on `http://127.0.0.1:5000`.*

### 3. Frontend Setup
1. Open another terminal in the root directory of the project.
2. Install Bun (if not already installed):
   ```bash
   # macOS, Linux, and WSL
   curl -fsSL https://bun.sh/install | bash
   
   # Windows
   powershell -c "irm bun.sh/install.ps1|iex"
   ```
3. Install frontend dependencies:
   ```bash
   bun install
   ```
4. Start the frontend development server:
   ```bash
   bun dev
   ```
5. **Open the Application**: Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

## Quick Health Checks
- Verify Ollama model is available:
   ```bash
   ollama list
   ```
- Verify backend LLM connectivity:
   ```bash
   cd backend
   python -m test_scripts.test_ollama
   ```

## Project Structure
- `src/app/`: Next.js application pages and layout
- `src/components/`: Reusable UI components
- `src/features/`: Feature-specific components (e.g., upload, analysis)
- `backend/`: FastAPI application, LLM helpers, and routes
- `backend/main.py`: Backend entry point
- `package.json`: Frontend dependencies and scripts
