from src.retriever import Retriever
from sentence_transformers import SentenceTransformer
import numpy as np

embedder = SentenceTransformer("BAAI/bge-m3")
retriever = Retriever(use_reranker=True)

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def evaluate_retrieval(dataset, top_k=5, threshold=0.7):
    hits, total, rr_sum = 0, 0, 0
    for sample in dataset:
        query = sample["query"]
        ground_truths = sample["ground_truth"]

        results = retriever.retrieve(query, top_k=top_k)
        docs = [item[0] for item in results]  # just documents

        total += 1
        found = False

        for rank, doc in enumerate(docs, start=1):
            doc_emb = embedder.encode(doc)
            for gt in ground_truths:
                gt_emb = embedder.encode(gt)
                sim = cosine_sim(doc_emb, gt_emb)
                if sim >= threshold:  # consider it a match
                    hits += 1
                    rr_sum += 1.0 / rank
                    found = True
                    break
            if found:
                break

    recall_at_k = hits / total
    mrr = rr_sum / total
    return recall_at_k, mrr

if __name__ == "__main__":
    dataset = [
        {
            "query": "Enter the numbers without any gaps",
            "ground_truth": [
                "Ensure no spaces in numeric fields.",
                "Extend number range in SNRO transaction."
            ]
        },
        {
            "query": "Error while accessing logical system &1",
            "ground_truth": [
                "Check RFC destination settings.",
                "Verify logical system assignment in BD54."
            ]
        }
    ]

    recall, mrr = evaluate_retrieval(dataset, top_k=5)
    print(f"Recall@3: {recall:.2f}")
    print(f"MRR@3: {mrr:.2f}")
