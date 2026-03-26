import json
from pathlib import Path
import torch
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter


class Embedder:
    def __init__(self, model_name: str = "BAAI/bge-m3", device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔹 Using device: {device}")

        self.device = device
        self.model = SentenceTransformer(model_name, device=self.device)

        # Optimized chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=50,
            separators=["\n\n", "\n", ". ", " "]
        )

    def embed_dataset(self, json_file: str, batch_size: int = 16):
        """
        Load dataset (JSON), chunk error + resolutions, embed in batches.
        Returns a list of dicts with embeddings + metadata.
        """
        path = Path(json_file)
        if not path.exists():
            raise FileNotFoundError(f" File not found: {json_file}")

        with open(path, "r", encoding="utf-8") as f:
            dataset = json.load(f)

        print(f" Loaded {len(dataset)} records from {json_file}")

        records_to_embed = []
        for i, record in enumerate(dataset, start=1):
            combined_text = f"Error: {record['error_message']}\nResolution: {record['resolutions']}"
            chunks = self.text_splitter.split_text(combined_text)

            for j, chunk in enumerate(chunks, start=1):
                records_to_embed.append({
                    "id": f"err_{i}_chunk{j}",
                    "text": chunk,
                    "metadata": {
                        "error_message": record["error_message"],
                        "resolutions": record["resolutions"]
                    }
                })

        print(f" Total chunks to embed: {len(records_to_embed)}")

        # Batch embedding for speed
        texts = [rec["text"] for rec in records_to_embed]
        embeddings = self.model.encode(texts, batch_size=batch_size, convert_to_numpy=True)

        embedded_records = []
        for rec, emb in zip(records_to_embed, embeddings):
            embedded_records.append({
                "id": rec["id"],
                "text": rec["text"],
                "embedding": emb.tolist(),
                "metadata": rec["metadata"]
            })

        return embedded_records


if __name__ == "__main__":
    embedder = Embedder()
    data = embedder.embed_dataset("data/processed/sap_errors.json")

    output_path = Path("data/processed/sap_errors_with_embeddings.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f" Embeddings saved to {output_path}")
