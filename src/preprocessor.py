import re
import json
from pathlib import Path
import pandas as pd
from src.data_loader import load_excel


def clean_text(text: str) -> str:
    """Remove prefixes/markdown from resolution text."""
    if pd.isna(text):
        return ""
    text = re.sub(r"^#+\s*", "", text)  # remove headers (##, ###)
    text = re.sub(r"(Error Resolution:|Error Analysis:|# Error:)", "", text, flags=re.IGNORECASE)
    return text.strip()


def preprocess(input_file: str, output_dir: str = "data/processed"):
    """Process dataset -> clean -> save JSON + CSV."""
    df = load_excel(input_file)

    # Select only important columns
    df = df[["error_message", "openai_resolution", "gemini_resolution"]]

    # Clean text
    df["openai_resolution"] = df["openai_resolution"].apply(clean_text)
    df["gemini_resolution"] = df["gemini_resolution"].apply(clean_text)

    # Normalize JSON schema
    records = []
    for _, row in df.iterrows():
        records.append({
            "error_message": row["error_message"],
            "resolutions": {
                "openai": row["openai_resolution"],
                "gemini": row["gemini_resolution"]
            }
        })

    # Ensure output dir
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Save JSON
    json_path = Path(output_dir) / "sap_errors.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=4, ensure_ascii=False)

    # Save CSV
    csv_path = Path(output_dir) / "sap_errors.csv"
    df.to_csv(csv_path, index=False, encoding="utf-8")

    print(f" Preprocessing done: {json_path}, {csv_path}")


if __name__ == "__main__":
    input_file = "D:\#Code\VS Code\SAP_sample01\data\\raw\error_resolutions_100.xlsx" 
    preprocess(input_file)