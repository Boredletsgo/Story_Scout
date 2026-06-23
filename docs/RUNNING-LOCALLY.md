# Running Story Scout Locally (Native, No Docker)

## Why native?

The app was **designed for Docker** (Postgres + a ChromaDB server + MLflow, all
orchestrated by `docker-compose.yml`). On this machine Docker is **blocked**
because hardware virtualization (VT-x) is disabled in BIOS, so WSL2 / Docker
Desktop cannot start.

To run the app anyway, it was adapted to run **natively** on Windows with a set
of drop-in, zero-infrastructure substitutes:

| Concern        | Docker design              | Native substitute                          |
| -------------- | -------------------------- | ------------------------------------------ |
| Database       | PostgreSQL (asyncpg)       | **SQLite** (`aiosqlite`) — single file     |
| Vector store   | ChromaDB **server**        | **ChromaDB local-persistent** client       |
| Experiment log | MLflow tracking server     | **MLflow disabled** (`ENABLE_MLFLOW=false`)|
| LLM            | OpenAI / Anthropic (paid)  | **Ollama `llama3.2:3b`** — free & offline  |

All of these are selected automatically from environment variables in
`backend/.env`, so no code changes are needed to switch back to the Docker stack.

## Performance tradeoff

Running the LLM locally on **CPU** (no GPU) is the cost of going fully offline
and free. A single recommendation turn makes **~7 sequential LLM calls**
(1 preference + 5 explanations + 1 reply), so:

- **Cold turn (first after a server start): ~3–5 min** — one-time loads of the
  3B model and the sentence-transformers embedding model into RAM.
- **Warm full-recommendation turn: ~2 min** — models stay resident, so only the
  LLM call time remains.
- **Warm clarify turn: ~10 s** — the clarify path skips retrieval + explanations.

These cold loads are cached after the first turn, so subsequent messages are
much faster. On a machine with a GPU (or using a hosted model like
OpenAI/Anthropic) turns drop to a few seconds.

## Prerequisites

- **Python 3.13** (backend venv at `backend/.venv`)
- **Node.js 20+** (frontend)
- **Ollama** installed, with a model pulled:
  ```powershell
  ollama pull llama3.2:3b
  ```

## `backend/.env` (native config)

```dotenv
SECRET_KEY=<your-secret>
DATABASE_URL=sqlite+aiosqlite:///<abs-path>/backend/data/storyscout.db
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
ENABLE_MLFLOW=false
CHROMA_HOST=localhost
CHROMA_PORT=9999            # deliberately unused -> fast fallback to local Chroma
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

> `DATABASE_URL` uses an **absolute** path so `uvicorn` is independent of the
> working directory. `BACKEND_CORS_ORIGINS` must be a **JSON array** in `.env`.

## Run it

```powershell
# 1. Backend (from backend/)
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m scripts.seed          # creates tables + 20 books + demo user
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# 2. Frontend (from frontend/, in a second terminal)
cd frontend
npm install
npm run dev                                          # http://localhost:5173
```

Then open **http://localhost:5173** and log in with the seeded demo account:

- **Email:** `demo@storyscout.ai`
- **Password:** `storyscout123`

> The first chat message after a server start is slow (cold model load);
> subsequent messages are faster.

## Switching back to the Docker stack

Nothing in the code is hard-coded to SQLite/Ollama. Restore the Docker design by
pointing `backend/.env` (or `.env.docker`) at Postgres + the Chroma server +
a real LLM provider and running `docker compose up`. See `docker-compose.yml`.
