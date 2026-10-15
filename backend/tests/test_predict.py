import json
from pathlib import Path

from xgboost import XGBClassifier

from app.predict import predict_stages
from fake_data import make_fake_night

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"


def load_model_and_meta():
    model = XGBClassifier()
    model.load_model(ARTIFACTS_DIR / "xgb_model.json")
    with open(ARTIFACTS_DIR / "model_meta.json") as file:
        meta = json.load(file)
    return model, meta


def test_predict_stages_gives_one_valid_stage_per_epoch():
    model, meta = load_model_and_meta()
    motion, heart_rate = make_fake_night()
    stages = predict_stages(model, meta, motion, heart_rate)
    assert len(stages) == 20
    assert set(stages) <= {0, 1, 2}