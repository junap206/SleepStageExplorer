"""
export_sample_results.py

Precomputes the model's answer for every sample night and writes it as static
JSON into the frontend, so the website can show the sample nights instantly
without waiting for the backend to wake up - should take less than a second now.

Run it again whenever the model or the sample nights change, from the
backend folder:
    python export_sample_results.py
"""
import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

OUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "samples"


def build_files():
    """Return {file name: JSON text} for the index and every sample night."""
    client = TestClient(app)
    index = client.get("/samples").json()
    files = {"index.json": index}
    for item in index["samples"]:
        files[f"{item['id']}.json"] = client.get(f"/samples/{item['id']}").json()
    return {name: json.dumps(body, separators=(",", ":")) + "\n"
            for name, body in files.items()}


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, text in build_files().items():
        (OUT_DIR / name).write_text(text)
        print("wrote", OUT_DIR / name)


if __name__ == "__main__":
    main()
