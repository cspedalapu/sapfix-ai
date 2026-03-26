# SAPFix AI

SAPFix AI is a Python RAG prototype for SAP error-resolution support with a new Node.js frontend for a cleaner chat workflow.

## What Is In This Repo

- `src/`: Python retrieval, embedding, vector-store, and LLM wrappers.
- `app.py`: Current Streamlit prototype for running the pipeline end-to-end.
- `data/`: Local raw and processed SAP datasets. Real files are ignored by git.
- `output/`: Generated Chroma and runtime artifacts. Ignored by git.
- `evaluation/`: Small evaluation scripts for retrieval and answer quality experiments.
- `frontend/`: New React + Vite frontend inspired by the chat-first layout cues from `https://chatgpt.com/`.

## Frontend

The new frontend gives the project a more modern support-console experience:

- Left sidebar for recent investigations
- Focused chat thread in the center
- Structured assistant cards with business context, root cause, steps, and retrieved matches
- API mode when a backend endpoint is available
- Mock mode with seeded SAP cases until the Python backend exposes `/chat`

### Run The Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` from `frontend/.env.example` if you want the UI to call a backend:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If `VITE_API_BASE_URL` is not set, the frontend stays usable in mock mode.

## Suggested Backend API Contract

The frontend is ready for a `POST /chat` endpoint with a payload like:

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

A matching response can look like:

```json
{
  "answer": "Re-enter the value without spaces and validate the number range.",
  "diagnostic_label": "/SCWM/LT 120 - Numeric entry or number-range issue",
  "sections": {
    "businessContext": "Warehouse execution document entry.",
    "rootCause": "Invalid formatting or exhausted number range.",
    "steps": ["Re-enter the value", "Check SNRO interval"],
    "prevention": ["Validate copied numbers", "Monitor number ranges"]
  },
  "sources": [
    {
      "title": "Enter the numbers without any gaps",
      "system": "SAP EWM",
      "origin": "OpenAI resolution",
      "summary": "Check numeric formatting first.",
      "confidence": "High match"
    }
  ],
  "latency_ms": 842
}
```

## Current Notes

- Python dependencies remain in `requirements.txt`.
- `.env`, `.venv`, processed data, and generated output are ignored by git.
- The frontend is ready now, but the Python side still needs a dedicated HTTP API for full integration.
