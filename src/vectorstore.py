import json
from pathlib import Path
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import torch  

# import logging
# logging.getLogger("chromadb").setLevel(logging.ERROR)


class VectorStore:
    def __init__(self, persist_dir: str = "output/chroma_store", collection_name: str = "sap_errors"):
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(collection_name)

        # Load same embedding model used in embedder.py
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.embedder = SentenceTransformer("BAAI/bge-m3", device=device)
        print(f" Vector DB initialized at {persist_dir}, collection: {collection_name}")

    def add_records(self, embedded_file: str):
        """
        Load embedded dataset JSON and insert into ChromaDB.
        :param embedded_file: JSON file with embeddings (from embedder.py).
        """
        path = Path(embedded_file)
        if not path.exists():
            raise FileNotFoundError(f" File not found: {embedded_file}")

        with open(path, "r", encoding="utf-8") as f:
            dataset = json.load(f)

        # Insert each record
        for record in dataset:
            self.collection.add(
                ids=[record["id"]],
                embeddings=[record["embedding"]],
                documents=[record["error_message"]],
                metadatas=[{
                    "openai_resolution": record["resolutions"]["openai"],
                    "gemini_resolution": record["resolutions"]["gemini"]
                }]
    )

        print(f" Added {len(dataset)} records to ChromaDB.")

    def query(self, query_text: str, top_k: int = 3):
        """Embed query with bge-m3 before searching."""
        query_emb = self.embedder.encode(query_text).tolist()

        results = self.collection.query(
            query_embeddings=[query_emb],   # use embedding instead of query_texts
            n_results=top_k
        )
        return results


if __name__ == "__main__":
    # Initialize vector store
    vs = VectorStore()

    # Step 1: Load embeddings from file
    vs.add_records("data/processed/sap_errors_with_embeddings.json")

    # Step 2: Test query
    query = "system says enter numbers without spaces"
    results = vs.query(query, top_k=2)

    print(" Query Results:")
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        print(f" {doc}")
        print(f" OpenAI Suggestion: {meta.get('openai_resolution', 'N/A')[:200]}...\n")
        print(f" Gemini Suggestion: {meta.get('gemini_resolution', 'N/A')[:200]}...\n")