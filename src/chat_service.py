from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass
from difflib import SequenceMatcher
from functools import lru_cache
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

GPT_UI_MODEL = "gpt-4o-mini"
MODEL_LABELS = {
    "llama3.1:8b": "Ollama Llama 3.1 8B",
    GPT_UI_MODEL: "GPT-4o-mini",
}

DEFAULT_MODEL = GPT_UI_MODEL
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/api/generate")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
GITHUB_MODELS_ENDPOINT = os.getenv("GITHUB_MODELS_ENDPOINT", "https://models.github.ai/inference").rstrip("/")
GITHUB_MODEL = os.getenv("GITHUB_MODEL", "openai/gpt-4o-mini").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", GPT_UI_MODEL).strip()


@dataclass
class RetrievedRecord:
    error_message: str
    openai_resolution: str
    gemini_resolution: str
    score: float


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


@lru_cache(maxsize=1)
def load_knowledge_base() -> list[dict[str, Any]]:
    kb_path = Path("data/processed/sap_errors.json")
    if not kb_path.exists():
        raise FileNotFoundError(f"Knowledge base not found: {kb_path}")

    with kb_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


class KeywordRetriever:
    def __init__(self) -> None:
        self.records = load_knowledge_base()

    def retrieve(self, query: str, top_k: int = 3) -> list[RetrievedRecord]:
        query_tokens = set(tokenize(query))
        normalized_query = query.strip().lower()
        ranked: list[RetrievedRecord] = []

        for record in self.records:
            error_message = str(record.get("error_message", ""))
            resolutions = record.get("resolutions", {}) if isinstance(record.get("resolutions", {}), dict) else {}
            openai_resolution = str(resolutions.get("openai", ""))
            gemini_resolution = str(resolutions.get("gemini", ""))

            searchable_text = " ".join([error_message, openai_resolution[:1600], gemini_resolution[:1600]]).lower()
            searchable_tokens = set(tokenize(searchable_text))
            error_tokens = set(tokenize(error_message))

            overlap = len(query_tokens & searchable_tokens)
            error_overlap = len(query_tokens & error_tokens)
            phrase_ratio = SequenceMatcher(None, normalized_query, error_message.lower()).ratio()
            substring_bonus = 1.0 if normalized_query and normalized_query in searchable_text else 0.0

            score = (error_overlap * 4.0) + (overlap * 1.5) + (phrase_ratio * 3.0) + substring_bonus
            ranked.append(
                RetrievedRecord(
                    error_message=error_message,
                    openai_resolution=openai_resolution,
                    gemini_resolution=gemini_resolution,
                    score=score,
                )
            )

        ranked.sort(key=lambda item: item.score, reverse=True)
        return ranked[: max(1, top_k)]


def normalize_text(text: str) -> str:
    cleaned = text.replace("\r", "")
    cleaned = re.sub(r"[*`>#]", "", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def first_heading_section(text: str, headings: list[str]) -> str:
    cleaned = normalize_text(text)
    lowered = cleaned.lower()

    for heading in headings:
        position = lowered.find(heading.lower())
        if position == -1:
            continue

        snippet = cleaned[position:]
        lines = [line.strip(" :-") for line in snippet.splitlines()[1:] if line.strip()]
        collected: list[str] = []
        for line in lines:
            lowered_line = line.lower()
            if lowered_line in {
                "business context",
                "possible solutions",
                "step-by-step guidance",
                "step-by-step solution",
                "steps",
                "prevention tips",
                "common pitfalls",
                "root cause",
            }:
                break
            if lowered_line.startswith("t-code") or lowered_line.startswith("img path"):
                break
            collected.append(line)
            if len(" ".join(collected)) > 420:
                break

        if collected:
            return " ".join(collected).strip()

    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n", cleaned) if paragraph.strip()]
    return paragraphs[0] if paragraphs else ""


def extract_steps(text: str) -> list[str]:
    cleaned = normalize_text(text)
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
    steps: list[str] = []

    for line in lines:
        if re.match(r"^(?:\d+[.)]|[-•])\s+", line):
            step = re.sub(r"^(?:\d+[.)]|[-•])\s+", "", line).strip()
            if len(step) > 10:
                steps.append(step)
        elif line.lower().startswith("step "):
            parts = line.split(":", 1)
            candidate = parts[1].strip() if len(parts) == 2 else line
            if len(candidate) > 10:
                steps.append(candidate)
        if len(steps) == 5:
            break

    if steps:
        return steps

    sentences = [segment.strip() for segment in re.split(r"(?<=[.!?])\s+", cleaned) if segment.strip()]
    return sentences[:4]


def extract_prevention(text: str) -> list[str]:
    prevention_block = first_heading_section(text, ["Prevention Tips", "Prevention"])
    lines = [line.strip() for line in prevention_block.splitlines() if line.strip()]
    tips: list[str] = []

    for line in lines:
        tip = re.sub(r"^(?:\d+[.)]|[-•])\s+", "", line).strip()
        if len(tip) > 8:
            tips.append(tip)
    return tips[:4]


def build_sources(records: list[RetrievedRecord]) -> list[dict[str, str]]:
    sources: list[dict[str, str]] = []
    for record in records:
        summary_seed = first_heading_section(record.openai_resolution, ["Business Context", "Possible Solutions"])
        sources.append(
            {
                "title": record.error_message,
                "system": "SAP knowledge base",
                "origin": "Curated OpenAI and Gemini resolutions",
                "summary": summary_seed or record.openai_resolution[:260],
                "confidence": f"Score {record.score:.2f}",
            }
        )
    return sources


def build_sections_from_records(records: list[RetrievedRecord]) -> dict[str, Any]:
    primary = records[0]
    business_context = first_heading_section(primary.openai_resolution, ["Business Context"])
    root_cause = first_heading_section(primary.gemini_resolution, ["Business Context", "Possible Solutions", "Root Cause"])
    steps = extract_steps(primary.openai_resolution) or extract_steps(primary.gemini_resolution)
    prevention = extract_prevention(primary.openai_resolution) or extract_prevention(primary.gemini_resolution)

    if not root_cause:
        root_cause = "The closest knowledge-base match points to a configuration or master-data issue that should be validated before retrying the transaction."

    return {
        "businessContext": business_context or "The nearest SAP knowledge-base article matched the incident based on error text similarity.",
        "rootCause": root_cause,
        "steps": steps[:4] if steps else [
            "Review the closest knowledge-base match and validate the related configuration or master data.",
            "Repeat the business step once the blocking condition has been corrected.",
        ],
        "prevention": prevention[:3],
    }


def build_fallback_answer(records: list[RetrievedRecord], sections: dict[str, Any]) -> str:
    primary = records[0]
    lead = f"I matched this issue to '{primary.error_message}'."
    steps = sections.get("steps", [])
    next_steps = " ".join(f"{index + 1}. {step}" for index, step in enumerate(steps[:3]))
    root_cause = sections.get("rootCause", "")
    return " ".join(part for part in [lead, root_cause, next_steps] if part).strip()


def format_history(history: list[dict[str, str]]) -> str:
    if not history:
        return ""

    recent = history[-4:]
    lines = [f"{item.get('role', 'user')}: {item.get('text', '').strip()}" for item in recent if item.get("text")]
    return "\n".join(lines)


def build_generation_prompt(query: str, history: list[dict[str, str]], records: list[RetrievedRecord]) -> str:
    context_lines = []
    for index, record in enumerate(records, start=1):
        context_lines.append(
            "\n".join(
                [
                    f"Match {index}: {record.error_message}",
                    f"OpenAI Resolution:\n{record.openai_resolution}",
                    f"Gemini Resolution:\n{record.gemini_resolution}",
                ]
            )
        )

    history_block = format_history(history)
    joined_context = "\n\n".join(context_lines)

    return f"""
You are SAPFix AI, an SAP troubleshooting assistant.

Use only the retrieved knowledge-base content below.
Do not invent steps outside that context.
Return valid JSON with this exact schema:
{{
  "answer": "short final answer",
  "diagnostic_label": "closest SAP issue label",
  "sections": {{
    "businessContext": "...",
    "rootCause": "...",
    "steps": ["..."],
    "prevention": ["..."]
  }}
}}

Conversation history:
{history_block or "No earlier messages."}

User query:
{query}

Retrieved knowledge base context:
{joined_context}
""".strip()


def get_github_token() -> str:
    if GITHUB_TOKEN:
        return GITHUB_TOKEN
    if OPENAI_API_KEY.lower().startswith("github_"):
        return OPENAI_API_KEY
    return ""


def resolve_gpt_backend() -> tuple[OpenAI, str, str, str]:
    github_token = get_github_token()
    if github_token:
        return (
            OpenAI(base_url=GITHUB_MODELS_ENDPOINT, api_key=github_token),
            GITHUB_MODEL,
            f"GitHub Models - {GITHUB_MODEL}",
            "github-models",
        )

    if OPENAI_API_KEY:
        return (
            OpenAI(api_key=OPENAI_API_KEY),
            OPENAI_MODEL,
            f"OpenAI - {OPENAI_MODEL}",
            "openai",
        )

    raise RuntimeError("No GPT token is configured. Set GITHUB_TOKEN to use GitHub Models.")


def generate_with_gpt(query: str, history: list[dict[str, str]], records: list[RetrievedRecord]) -> tuple[dict[str, Any], str, str, str]:
    client, provider_model, provider_label, provider_name = resolve_gpt_backend()
    prompt = build_generation_prompt(query, history, records)

    response = client.chat.completions.create(
        model=provider_model,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a precise SAP troubleshooting assistant that returns JSON."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=900,
    )

    content = response.choices[0].message.content or "{}"
    return json.loads(content), provider_model, provider_label, provider_name


def generate_with_ollama(model: str, query: str, history: list[dict[str, str]], records: list[RetrievedRecord]) -> tuple[dict[str, Any], str, str]:
    prompt = build_generation_prompt(query, history, records)
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2, "num_predict": 900},
    }
    response = requests.post(OLLAMA_BASE_URL, json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()
    content = data.get("response", "{}")
    return json.loads(content), model, MODEL_LABELS.get(model, model)


def coerce_sections(payload: dict[str, Any], fallback_sections: dict[str, Any]) -> dict[str, Any]:
    sections = payload.get("sections", {}) if isinstance(payload.get("sections"), dict) else {}
    steps = sections.get("steps") if isinstance(sections.get("steps"), list) else fallback_sections.get("steps", [])
    prevention = sections.get("prevention") if isinstance(sections.get("prevention"), list) else fallback_sections.get("prevention", [])

    return {
        "businessContext": str(sections.get("businessContext") or fallback_sections.get("businessContext") or "").strip(),
        "rootCause": str(sections.get("rootCause") or fallback_sections.get("rootCause") or "").strip(),
        "steps": [str(step).strip() for step in steps if str(step).strip()],
        "prevention": [str(item).strip() for item in prevention if str(item).strip()],
    }


def describe_generation_fallback(model: str, error: Exception) -> str:
    text = str(error).lower()
    if model == GPT_UI_MODEL:
        if not get_github_token() and not OPENAI_API_KEY:
            return "Set GITHUB_TOKEN in .env to enable GitHub Models responses."
        if get_github_token():
            if "invalid_api_key" in text or "incorrect api key" in text or "authenticationerror" in text or "401" in text:
                return "GitHub Models authentication failed. Check GITHUB_TOKEN in .env."
            return "GitHub Models could not be reached, so the reply was generated from the local knowledge base."
        if "invalid_api_key" in text or "incorrect api key" in text or "authenticationerror" in text or "401" in text:
            return "OpenAI authentication failed. Check OPENAI_API_KEY in .env."
        return "The GPT provider could not be reached, so the reply was generated from the local knowledge base."

    if "connection refused" in text or "failed to establish a new connection" in text or "max retries exceeded" in text:
        return "Ollama is not reachable at the configured local URL, so the reply was generated from the local knowledge base."
    return "The requested model was unavailable, so the reply was generated from the local knowledge base."


def generate_chat_response(query: str, model: str = DEFAULT_MODEL, top_k: int = 3, history: list[dict[str, str]] | None = None) -> dict[str, Any]:
    started = time.perf_counter()
    history = history or []

    if not query.strip():
        return {
            "answer": "Please provide the SAP error text or a short description.",
            "diagnostic_label": "Missing SAP incident details",
            "sections": {
                "businessContext": "The request did not include an SAP error or process description.",
                "rootCause": "The assistant needs the actual error text, T-code, or business step to search the knowledge base.",
                "steps": [
                    "Paste the exact SAP error message.",
                    "Include the transaction code and business step where it appears.",
                ],
                "prevention": [],
            },
            "sources": [],
            "latency_ms": int((time.perf_counter() - started) * 1000),
            "mode": "api",
            "model": model,
            "requested_model": model,
            "generation_model": "none",
            "generation_label": "No generation model used",
            "generation_note": "",
        }

    retriever = KeywordRetriever()
    records = retriever.retrieve(query, top_k=top_k)
    sections = build_sections_from_records(records)
    answer = build_fallback_answer(records, sections)
    diagnostic_label = records[0].error_message if records else "Knowledge base match"
    generation_model = "knowledge-base-synthesis"
    generation_label = "Knowledge base synthesis"
    generation_note = ""

    try:
        if model == GPT_UI_MODEL:
            payload, provider_model, provider_label, _ = generate_with_gpt(query, history, records)
            generation_model = provider_model
            generation_label = provider_label
        else:
            payload, provider_model, provider_label = generate_with_ollama(model, query, history, records)
            generation_model = provider_model
            generation_label = provider_label

        sections = coerce_sections(payload, sections)
        answer = str(payload.get("answer") or answer).strip()
        diagnostic_label = str(payload.get("diagnostic_label") or diagnostic_label).strip()
    except Exception as error:
        generation_note = describe_generation_fallback(model, error)

    return {
        "answer": answer,
        "diagnostic_label": diagnostic_label,
        "sections": sections,
        "sources": build_sources(records),
        "latency_ms": int((time.perf_counter() - started) * 1000),
        "mode": "api",
        "model": model,
        "requested_model": model,
        "generation_model": generation_model,
        "generation_label": generation_label,
        "generation_note": generation_note,
    }
