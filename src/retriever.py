import logging
logging.getLogger("chromadb").setLevel(logging.ERROR)

import torch
from sentence_transformers import CrossEncoder, SentenceTransformer
from src.vectorstore import VectorStore


class Retriever:
    def __init__(self, collection_name: str = "sap_errors",
                 persist_dir: str = "output/chroma_store",
                 reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
                 use_reranker: bool = True):
        """
        Retriever with optional reranking.
        """
        self.vectorstore = VectorStore(persist_dir, collection_name)

        # ✅ same embedder as used in embedder.py
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.embedder = SentenceTransformer("BAAI/bge-m3", device=device)

        self.use_reranker = use_reranker
        if use_reranker:
            print(f" Loading reranker on {device} ...")
            self.reranker = CrossEncoder(reranker_model, device=device)
        else:
            self.reranker = None

    def retrieve(self, query: str, top_k: int = 5, rerank: bool = False):
        """
        Retrieve top-k results, optionally rerank them.
        """
        # Step 1: Embed query
        query_emb = self.embedder.encode(query).tolist()
        results = self.vectorstore.collection.query(
            query_embeddings=[query_emb],
            n_results=top_k
        )

        candidates = []
        for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
            if meta is None:
                meta = {}
            candidates.append((doc, meta))

        # Step 2: Rerank if enabled
        if rerank and self.use_reranker and self.reranker:
            pairs = [(query, doc) for doc, _ in candidates]
            scores = self.reranker.predict(pairs)
            reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
            candidates = [(doc, meta, float(score)) for (doc, meta), score in reranked]
        else:
            candidates = [(doc, meta, None) for doc, meta in candidates]

        return candidates


# if __name__ == "__main__":
#     retriever = Retriever(use_reranker=True)

#     query = "system says numbers cannot have spaces"
#     results = retriever.retrieve(query, top_k=3)

#     print("\n Final Retrieved Results:")
#     for i, (doc, meta) in enumerate(results, start=1):
#         print(f"{i}.  {doc}")
#         print(f"OpenAI Suggestion: {meta.get('openai_resolution', 'N/A')[:200]}...\n")
#         print(f"Gemini Suggestion: {meta.get('gemini_resolution', 'N/A')[:200]}...\n")


if __name__ == "__main__":
    retriever = Retriever(use_reranker=True)

    query = input(" Enter your SAP error message: ")
    results = retriever.retrieve(query, top_k=3)

    print("\n Pipeline Log")
    print(" Query:", query)

    print("\n Retrieved & Reranked Results:")
    for i, (doc, meta, score) in enumerate(results, start=1):
        print(f"{i}. {doc} (score: {score})")
        print(f"   OpenAI Suggestion: {meta.get('openai_resolution', 'N/A')[:250]}...")
        print(f"   Gemini Suggestion: {meta.get('gemini_resolution', 'N/A')[:250]}...\n")
