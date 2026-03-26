import logging
logging.getLogger("chromadb").setLevel(logging.ERROR)

import os
from openai import OpenAI
from dotenv import load_dotenv
import time


import os
import time
from dotenv import load_dotenv
from openai import OpenAI
from src.retriever import Retriever

# Load environment variables
load_dotenv()

EMPTY_QUERY_MSG = "No error message given. Please provide the SAP error text or a short description."
NO_SOLUTION_MSG = "No solution found in the knowledge base for this error. Please check with the SAP team."


class OpenAILLM:
    def __init__(self, model: str = "gpt-4o-mini"):
        """
        Wrapper for OpenAI GPT models.
        Requires OPENAI_API_KEY in .env
        """
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(" OPENAI_API_KEY not found in .env file")

        self.client = OpenAI(api_key=api_key)
        self.model = model

    def generate(self, query: str, retrieved_results: list, max_tokens: int = 500) -> str:
        """
        Generate final answer if retrieval returns results.
        :param query: User's error message or question.
        :param retrieved_results: List of tuples (doc, metadata) from retriever.
        :param max_tokens: Max output length.
        """
        if not query.strip():
            return EMPTY_QUERY_MSG

        if not retrieved_results:   # Nothing found in Chroma
            return NO_SOLUTION_MSG

        # Build context from retriever
        # Build context safely
        context_chunks = []
        for item in retrieved_results:
            # Case 1: normal (doc, meta)
            if isinstance(item, tuple) and len(item) == 2:
                doc, meta = item
            # Case 2: retriever returned extra values
            elif isinstance(item, (list, tuple)) and len(item) > 2:
                doc, meta = item[0], item[-1]   # take first as doc, last as meta
            else:
                continue

            openai_suggestion = meta.get("openai_resolution", "N/A") if isinstance(meta, dict) else "N/A"
            gemini_suggestion = meta.get("gemini_resolution", "N/A") if isinstance(meta, dict) else "N/A"

            context_chunks.append(
                f"Error: {doc}\nOpenAI Suggestion: {openai_suggestion}\nGemini Suggestion: {gemini_suggestion}"
            )

        context = "\n\n".join(context_chunks)


        prompt = f"""
You are an SAP troubleshooting assistant.

IMPORTANT RULE:
- Only use the retrieved knowledge base to answer.
- Do NOT hallucinate or guess beyond the context.
- If nothing relevant is retrieved, respond with:
'{NO_SOLUTION_MSG}'

The user encountered this error: {query}

Here are suggested fixes retrieved from the knowledge base:
{context}

Please generate a clear, step-by-step resolution that explains:
1. Business Context
2. Root Cause
3. Step-by-step Solution
4. Prevention Tips

Keep it concise and professional.
"""

        # Call OpenAI API
        response = self.client.chat.completions.create(
        model=self.model,
        messages=[
            {"role": "system", "content": "You are an SAP troubleshooting assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=max_tokens,
        temperature=0.2,
)


        return response.choices[0].message.content.strip()


if __name__ == "__main__":
    retriever = Retriever(use_reranker=True)
    llm = OpenAILLM(model="gpt-4o-mini")

    user_query = input(" Enter your SAP error message: ")

    start_time = time.time()

    # Step 1: Retrieve from ChromaDB
    retrieved_results = retriever.retrieve(user_query, top_k=2)

    # Step 2: Generate only if found
    final_answer = llm.generate(user_query, retrieved_results, max_tokens=200)


    elapsed = time.time() - start_time
    print(f"Time taken: {elapsed:.2f} seconds")

    print("\n================= FINAL ANSWER =================\n")
    print(final_answer)
    print("\n================================================\n")

    # Transparency: show retrieved chunks
    if retrieved_results:
        print(" Retrieved Chunks (with rerank scores):")
        for i, (doc, meta, score) in enumerate(retrieved_results, start=1):
            if not isinstance(meta, dict):
                meta = {}

            print(f"{i}. {doc} (score: {score})")
            print(f"   OpenAI Suggestion: {meta.get('openai_resolution', 'N/A')[:150]}...")
            print(f"   Gemini Suggestion: {meta.get('gemini_resolution', 'N/A')[:150]}...\n")




















































# # Load environment variables from .env
# load_dotenv()

# EMPTY_QUERY_MSG = "⚠️ No error message given. Please provide the SAP error text or a short description."

# class OpenAILLM:
#     def __init__(self, model: str = "gpt-4o-mini"):
#         """
#         Wrapper for OpenAI GPT models.
#         Requires OPENAI_API_KEY in .env
#         """
#         api_key = os.getenv("OPENAI_API_KEY")
#         if not api_key:
#             raise ValueError(" OPENAI_API_KEY not found in .env file")

#         self.client = OpenAI(api_key=api_key)
#         self.model = model

#     def generate(self, query: str, retrieved_results: list, max_tokens: int = 500) -> str:
#         """
#         Generate final answer by combining retrieved results + query.
#         :param query: User's error message or question.
#         :param retrieved_results: List of tuples (doc, metadata) from retriever.
#         :param max_tokens: Max output length.
#         :return: String response from GPT.
#         """
#         # ✅ Guard for empty input
#         if not query or not query.strip():
#             return EMPTY_QUERY_MSG

#         # Build context from retriever
#         context = "\n\n".join(
#             f"Error: {doc}\nOpenAI Suggestion: {meta.get('openai_resolution', 'N/A')}\nGemini Suggestion: {meta.get('gemini_resolution', 'N/A')}"
#             for doc, meta in retrieved_results
#         )

#         prompt = f"""
# You are an SAP troubleshooting assistant.

# IMPORTANT RULE:
# If the user's error message is empty or missing, respond ONLY with:
# '{EMPTY_QUERY_MSG}'
# Do not invent or assume anything.

# The user encountered this error: {query}

# Here are suggested fixes retrieved from the knowledge base:
# {context}

# Please generate a clear, step-by-step resolution that explains:
# 1. Business Context
# 2. Root Cause
# 3. Step-by-step Solution
# 4. Prevention Tips

# Keep it concise and professional.
# """

#         # Call OpenAI API
#         response = self.client.chat.completions.create(
#             model=self.model,
#             messages=[{"role": "system", "content": prompt}],
#             max_tokens=max_tokens,
#             temperature=0.2,
#         )

#         return response.choices[0].message.content.strip()


# if __name__ == "__main__":
#     # Example test
#     sample_results = [
#         (
#             "Error while accessing logical system &1",
#             {
#                 "openai_resolution": "Check RFC destination settings.",
#                 "gemini_resolution": "Verify logical system assignment in BD54."
#             }
#         )
#     ]

#     llm = OpenAILLM(model="gpt-4o-mini")


#     user_query = input(" Enter your SAP error message: ")

#     # Start timer
#     start_time = time.time()

#     answer = llm.generate(user_query, sample_results)

#     end_time = time.time()
#     elapsed = end_time - start_time

#     print("\n Final Answer:\n", answer)
#     print(f"\n Time taken: {elapsed:.2f} seconds")

    
