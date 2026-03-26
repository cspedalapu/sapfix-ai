import logging
logging.getLogger("chromadb").setLevel(logging.ERROR)

import requests
import json
import time
from src.retriever import Retriever

EMPTY_QUERY_MSG = " No error message given. Please provide the SAP error text or a short description."
NO_SOLUTION_MSG = " No solution found in the knowledge base for this error."

class LocalLLM:
    def __init__(self, model: str = "llama3.1:8b", base_url: str = "http://localhost:11434/api/generate"):
        """
        Wrapper for local LLM (Llama 3) via Ollama REST API.
        """
        self.model = model
        self.base_url = base_url

    def generate(self, query: str, retrieved_results: list, max_tokens: int = 500) -> str:
        """
        Generate final answer by combining retrieved results + query.
        Uses only knowledge base chunks.
        """
        if not query.strip():
            return EMPTY_QUERY_MSG

        if not retrieved_results:  # nothing found in Chroma
            return NO_SOLUTION_MSG

        # Build context from retriever
        context = "\n\n".join(
            f"Error: {doc}\nOpenAI Suggestion: {meta.get('openai_resolution', 'N/A')}\nGemini Suggestion: {meta.get('gemini_resolution', 'N/A')}"
            for doc, meta in retrieved_results
        )

        prompt = f"""
You are an SAP troubleshooting assistant.

RULES:
- Only use retrieved knowledge base entries.
- Do not hallucinate beyond context.
- If nothing is retrieved, reply with:
'{NO_SOLUTION_MSG}'

The user encountered this error: {query}

Here are suggested fixes from the knowledge base:
{context}

Please generate a clear, step-by-step resolution that explains:
1. Business Context
2. Root Cause
3. Step-by-step Solution
4. Prevention Tips

Keep it concise and professional.
"""

        # Call Ollama API
        payload = {
            "model": self.model,
            "prompt": prompt,
            "options": {"num_predict": max_tokens}
        }

        response = requests.post(self.base_url, json=payload, stream=True)
        if response.status_code != 200:
            raise Exception(f"LLM request failed: {response.text}")

        # Stream response
        output = ""
        for line in response.iter_lines():
            if line:
                data = json.loads(line.decode("utf-8"))
                if "response" in data:
                    output += data["response"]

        return output.strip()


if __name__ == "__main__":
    retriever = Retriever(use_reranker=True)
    llm = LocalLLM(model="llama3.1:8b")

    user_query = input(" Enter your SAP error message: ")

    start_time = time.time()

    # Step 1: Retrieve from Chroma
    results = retriever.retrieve(user_query, top_k=2, rerank=True)

    # Step 2: Strip score → only (doc, meta) for LLM
    ranked_for_llm = [(doc, meta) for doc, meta, score in results]
    final_answer = llm.generate(user_query, ranked_for_llm, max_tokens=200)

    elapsed = time.time() - start_time
    print(f"Time taken: {elapsed:.2f} seconds")

 
    # Transparency: Show retrieved chunks with rerank scores
    if results:
        print(" Retrieved Chunks (with rerank scores):")
        for i, (doc, meta, score) in enumerate(results, start=1):
            print(f"{i}. {doc} (score: {score})")
            print(f"   OpenAI Suggestion: {meta.get('openai_resolution', 'N/A')[:150]}...")
            print(f"   Gemini Suggestion: {meta.get('gemini_resolution', 'N/A')[:150]}...\n")

    print(f"Time taken: {elapsed:.2f} seconds")
















#------------------------------------------------------------

# from src.retriever import Retriever

# if __name__ == "__main__":
#     retriever = Retriever()
#     llm = LocalLLM(model="llama3.1:8b")   # Swap with OpenAILLM for API

#     # Step 1: Take input
#     user_query = input(" Enter your SAP error message: ")

#     # Step 2: Retrieve + rerank
#     results = retriever.retrieve(user_query, top_k=3, rerank=True)

#     # Step 3: Pass reranked results to LLM
#     ranked_for_llm = [(doc, meta) for doc, meta, _ in results]
#     answer = llm.generate(user_query, ranked_for_llm)

#     # Show Final Answer first
#     print("\n Final Answer:\n", answer)

#     # Then show retrieval logs
#     print("\n Pipeline Log")
#     print(" Query:", user_query)

#     print("\n Reranked Results (Top-3):")
#     for i, (doc, meta, score) in enumerate(results, 1):
#         print(f"{i}. {doc} (score: {score:.3f})")
#         print(f"   OpenAI Suggestion: {meta.get('openai_resolution')}")
#         print(f"   Gemini Suggestion: {meta.get('gemini_resolution')}\n")
