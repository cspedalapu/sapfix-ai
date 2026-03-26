import streamlit as st
import time
from datetime import datetime
from src.retriever import Retriever
from src.llm_local import LocalLLM
from src.llm_api import OpenAILLM

st.set_page_config(page_title="SAP Error Resolution Assistant", page_icon="🔧", layout="centered")

st.title("SAP Error Resolution Assistant")

# Model selector
model_choice = st.radio(
    "Choose model:",
    ("Local Llama 3.1:8b", "OpenAI GPT-4o-mini"),
    index=0
)

query = st.text_input("Enter your SAP error message:")

if query:
    retriever = Retriever()

    # Pick model
    if model_choice == "Local Llama 3.1:8b":
        llm = LocalLLM(model="llama3.1:8b")
    else:
        llm = OpenAILLM(model="gpt-4o-mini")

    # Run pipeline
    start = time.time()
    results = retriever.retrieve(query, top_k=3)
    ranked_for_llm = []
    for item in results:
        if len(item) == 2:
            doc, meta = item
        elif len(item) == 3:
            doc, meta, _ = item
        else:
            raise ValueError(f"Unexpected result format: {item}")
        ranked_for_llm.append((doc, meta))
    answer = llm.generate(query, ranked_for_llm)
    elapsed = time.time() - start
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S") 

    # Show timing and timestamp ABOVE Final Answer
    st.info(f"⏱ Time taken: {elapsed:.2f} seconds")
    # st.caption(f"📌 Retrieved at: {timestamp}")


    # Show final answer first
    st.subheader(" Final Answer")
    st.success(answer)

    # Then show retrieval logs
    st.subheader(" Retrieved Results")
    for i, (doc, meta) in enumerate(results, 1):
        with st.expander(f"{i}. {doc[:60]}..."):
            st.write("**OpenAI Suggestion:**", meta.get("openai_resolution", "N/A"))
            st.write("**Gemini Suggestion:**", meta.get("gemini_resolution", "N/A"))

    # Show timing and timestamp
    # st.info(f"⏱ Time taken: {elapsed:.2f} seconds")
