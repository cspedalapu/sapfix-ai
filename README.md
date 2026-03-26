
sap-rag-agent/
│
├── config/                         # Configuration files
│   ├── settings.yaml                # Paths, model names, API keys, DB configs
│   ├── logging.conf                 # Logging configuration
│
├── data/                           # Raw + processed datasets
│   ├── raw/                         # Original Excel/CSV files (101 msgs, big dataset later)
│   │   └── sap_errors_101.xlsx
│   ├── processed/                   # Converted JSON/CSV/chunks
│   │   └── sap_errors_101.json
│
├── src/                            # Core source code
│   ├── __init__.py
│   ├── data_loader.py               # Load Excel/CSV, clean, normalize schema
│   ├── preprocessor.py              # Chunking, embeddings prep
│   ├── embedder.py                  # Create embeddings (BAAI/bge-m3 etc.)
│   ├── vectorstore.py               # ChromaDB / Pinecone interface
│   ├── retriever.py                 # Hybrid search + reranking
│   ├── llm_local.py                 # Local LLM wrapper (Llama, Ollama)
│   ├── llm_api.py                   # API LLM wrapper (OpenAI/Gemini from GitHub Marketplace)
│   ├── agent.py                     # Core pipeline: Query → Retrieve → Rerank → Answer
│   └── utils.py                     # Helper functions (logging, config loader)
│
├── notebooks/                      # Jupyter notebooks for experimentation
│   └── prototype_rag.ipynb
│
├── output/                         # Logs, embeddings, ChromaDB storage
│   ├── chroma_store/                # Local vector DB
│   ├── logs/                        # Query logs, error logs
│   └── reports/                     # Evaluation results for manager
│
├── tests/                          # Unit tests
│   ├── test_loader.py
│   ├── test_retriever.py
│   └── test_agent.py
│
├── app.py                          # Entry point (Streamlit / CLI app)
├── requirements.txt                 # Python dependencies
├── README.md                        # Project overview for manager
└── LICENSE
