from nltk.translate.bleu_score import sentence_bleu
from rouge_score import rouge_scorer
from bert_score import score
from sentence_transformers import SentenceTransformer
import numpy as np

generated = "Ensure no spaces in numeric fields."
references = [
    "Make sure numbers are entered without gaps.",
    "Extend the number range in SNRO transaction."
]

# BLEU
bleu = sentence_bleu([r.split() for r in references], generated.split())

# ROUGE-L
scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=True)
rouge_scores = scorer.score(references[0], generated)

# BERTScore
P, R, F1 = score([generated], references, lang="en", verbose=False)

# Cosine Similarity (using BGE-M3 embeddings)
embedder = SentenceTransformer("BAAI/bge-m3")
gen_emb = embedder.encode(generated)
ref_embs = embedder.encode(references)
cosine_sim = np.max([np.dot(gen_emb, ref) / (np.linalg.norm(gen_emb)*np.linalg.norm(ref)) for ref in ref_embs])

print("BLEU:", bleu)
print("ROUGE-L:", rouge_scores)
print("BERTScore F1:", F1.mean().item())
print("Cosine Similarity:", cosine_sim)
