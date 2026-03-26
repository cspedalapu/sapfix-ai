# SAPFix AI

SAPFix AI is a Python SAP troubleshooting backend with a React frontend for chat-style incident diagnosis.

## Repo Structure

- `api_server.py`: FastAPI entrypoint exposing `/health`, `/models`, and `/chat`.
- `src/chat_service.py`: Retrieval plus generation orchestration.
- `src/`: Legacy retrieval, embedding, vector store, and LLM helpers.
- `frontend/`: React + Vite frontend.
- `data/`: Local SAP dataset files. Real data stays out of Git.
- `output/`: Generated local runtime artifacts. Ignored by Git.
- `app.py`: Older Streamlit prototype.

## Model Providers

The GPT path now prefers GitHub Models using the OpenAI-compatible API.

Provider order:

1. `GITHUB_TOKEN` with `https://models.github.ai/inference`
2. `OPENAI_API_KEY` as a fallback direct OpenAI path
3. Local knowledge-base synthesis if neither GPT provider is available

The local Llama option still uses Ollama through `OLLAMA_BASE_URL`.

## Environment

Create `.env` from `.env.example` and set the values you want to use:

```env
GITHUB_TOKEN=
GITHUB_MODELS_ENDPOINT=https://models.github.ai/inference
GITHUB_MODEL=openai/gpt-4o-mini
OPENAI_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434/api/generate
```

Notes:

- For GitHub Models, `GITHUB_TOKEN` is the important value.
- `OPENAI_API_KEY` is optional and only used as a fallback if `GITHUB_TOKEN` is missing.
- If you previously pasted a GitHub token into `OPENAI_API_KEY`, the backend will still recognize it, but `GITHUB_TOKEN` is the cleaner setup.

## Run The Backend

```bash
.venv\Scripts\python.exe -m uvicorn api_server:app --host 127.0.0.1 --port 8001
```

API endpoints:

- `GET /health`
- `GET /models`
- `POST /chat`

Example request:

```json
{
  "query": "Enter the numbers without any gaps",
  "model": "gpt-4o-mini",
  "top_k": 3,
  "history": [
    { "role": "user", "text": "Enter the numbers without any gaps" }
  ]
}
```

The response includes the requested model, the actual generation model, and a fallback note when GPT was not used.

## Run The Frontend

```bash
cd frontend
npm install
npm run build
npm run dev
```

Set the frontend API target in `frontend/.env.local` or `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001
```

## Current Behavior

- The frontend shows the requested model and the actual model/provider used.
- If GitHub Models or OpenAI is unavailable, the backend still returns a grounded answer using the local SAP knowledge base.
- The original embedding-based retriever is still in the repo, but the current API path uses an offline-safe keyword retrieval flow so the app remains usable without external model downloads.

## Screenshots

These screenshots are stored in [`docs/screenshots`](docs/screenshots) so they can be pushed to GitHub and referenced directly from this README.

### Demo 01

![Demo 01](docs/screenshots/sap_demo_01.png)

### Demo 02

![Demo 02](docs/screenshots/sap_demo_02.png)

### Demo 03

![Demo 03](docs/screenshots/sap_demo_03.png)

### Demo 04

![Demo 04](docs/screenshots/sap_demo_04.png)

### Demo 05

![Demo 05](docs/screenshots/sap_demo_05.png)

### Demo 06

![Demo 06](docs/screenshots/sap_demo_06.png)

### Demo 07

![Demo 07](docs/screenshots/sap_demo_07.png)

### Demo 08

![Demo 08](docs/screenshots/sap_demo_08.png)
