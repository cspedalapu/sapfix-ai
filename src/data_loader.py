import pandas as pd

def load_excel(file_path: str) -> pd.DataFrame:
    """Load Excel dataset into a DataFrame."""
    try:
        df = pd.read_excel(file_path)
        return df
    except Exception as e:
        print(f" Failed to load {file_path}: {e}")
        raise
