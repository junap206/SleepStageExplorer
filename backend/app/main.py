import json
import tempfile
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from xgboost import XGBClassifier

from app.predict import predict_stages
from sleepstager.raw_data_service import RawDataService
from sleepstager.recording_window import get_recording_window


ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
DISCLAIMER = "Research estimates from Applewatch device. This is NOT a medical diagnosis."

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

@app.get("/version")
def version():
    return {"xgboost_version": meta["xgboost_version"]}

@app.post("/predict")
async def predict(motion_file: UploadFile = File(...), hr_file: UploadFile = File(...)):
    with tempfile.TemporaryDirectory() as folder:
        motion_path = Path(folder) / "motion.csv"
        hr_path = Path(folder) / "hr.csv"
        motion_path.write_bytes(await motion_file.read())
        hr_path.write_bytes(await hr_file.read())
        try:
            motion = RawDataService.read_signal(str(motion_path), ["x", "y", "z"])
            heart_rate = RawDataService.read_signal(str(hr_path), ["bpm"])
        except (ValueError, pd.errors.ParserError, pd.errors.EmptyDataError):
            raise HTTPException(status_code=400, detail="Could not read the files as CSV.")

    if motion.empty or heart_rate.empty:
        raise HTTPException(status_code=400, detail="A file had no usable rows.")

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