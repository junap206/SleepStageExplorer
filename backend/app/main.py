import os
import json
import tempfile
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from xgboost import XGBClassifier

from app.predict import predict_from_features, predict_stages
from app.samples import compute_metrics, list_samples, load_sample
from app.validation import MAX_UPLOAD_BYTES, find_problems
from sleepstager.raw_data_service import RawDataService
from sleepstager.recording_window import get_recording_window


ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
DISCLAIMER = "Research estimates from Applewatch device. This is NOT a medical diagnosis."

app = FastAPI(title = "Sleep Stager API")
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
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

@app.get("/version")
def version():
    return {"xgboost_version": meta["xgboost_version"]}

@app.post("/predict")
async def predict(motion_file: UploadFile = File(...), hr_file: UploadFile = File(...)):
    motion_bytes = await motion_file.read()
    hr_bytes = await hr_file.read()
    if len(motion_bytes) > MAX_UPLOAD_BYTES or len(hr_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="A file is too large. The limit is 200 MB per file.")

    with tempfile.TemporaryDirectory() as folder:
        motion_path = Path(folder) / "motion.csv"
        hr_path = Path(folder) / "hr.csv"
        motion_path.write_bytes(motion_bytes)
        hr_path.write_bytes(hr_bytes)
        try:
            motion = RawDataService.read_signal(str(motion_path), ["x", "y", "z"])
            heart_rate = RawDataService.read_signal(str(hr_path), ["bpm"])
        except (ValueError, pd.errors.ParserError, pd.errors.EmptyDataError):
            raise HTTPException(status_code=400, detail=["Could not read the files as CSV."])

    problems = find_problems(motion, heart_rate)
    if problems:
        raise HTTPException(status_code=400, detail=problems)

    recording_start, _ = get_recording_window(motion)
    stages = predict_stages(model, meta, motion, heart_rate)
    return {
        "n_epochs": len(stages),
        "epoch_seconds": 30,
        "recording_start": recording_start,
        "stage_names": meta["stage_names"],
        "stages": stages,
        "disclaimer": DISCLAIMER,
    }

ATTRIBUTION = "Data: Song, Zhang, Zhou & Dutta (2026), PhysioNet, https://doi.org/10.13026/rees-1092. License: ODC-By 1.0."


@app.get("/samples")
def samples():
    return {"samples": list_samples()}


@app.get("/samples/{sample_id}")
def sample_night(sample_id: str):
    data = load_sample(sample_id)
    if data is None:
        raise HTTPException(status_code=404, detail="No such sample night.")

    table = pd.DataFrame(data["features"], columns=data["feature_names"])
    stages = predict_from_features(model, meta, table)

    return {
        "id": sample_id,
        "n_epochs": data["n_epochs"],
        "epoch_seconds": data["epoch_seconds"],
        "recording_start": data["recording_start"],
        "stage_names": meta["stage_names"],
        "stages": stages,
        "true_stages": data["true_stages"],
        "metrics": compute_metrics(data["true_stages"], stages),
        "attribution": ATTRIBUTION,
        "disclaimer": DISCLAIMER,
    }