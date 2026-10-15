from fastapi import FastAPI
import json
from pathlib import Path
from xgboost import XGBClassifier


ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"

app = FastAPI(title = "Sleep Stager API")

model = XGBClassifier()
model.load_model(ARTIFACTS_DIR / "xgb_model.json")

with open(ARTIFACTS_DIR / "model_meta.json") as file:
    meta = json.load(file)

print("Model loaded:", meta["n_features"], "features")

@app.get("/model_info")

def model_info():
    return {"n_features": meta["n_features"],
            "train_subjects": len(meta["train_subjects"]),
            "demo_subjects": meta["demo_subjects"],
            "xgboost_version": meta["xgboost_version"],
            "params": meta["params"],
            "created": meta["created"]
            }

@app.get("/health")

def health():
    return {"status": "ok"}

