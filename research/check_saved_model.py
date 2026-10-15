# 1. Imports and paths
# 2. Load the model from xgb_model.json
# 3. Load the metadata from model_meta.json
# 4. Print a few facts to prove it loaded


import json
from pathlib import Path

from xgboost import XGBClassifier

from dataset_service import DatasetService
from model_service import ModelService

HERE = Path(__file__).resolve().parent
ARTIFACTS_DIR = HERE.parent / "backend" / "artifacts"

model = XGBClassifier()
model.load_model(ARTIFACTS_DIR / "xgb_model.json")

with open(ARTIFACTS_DIR / "model_meta.json") as file:
    meta = json.load(file)

print("Features:", meta["n_features"])
print("Trained on subjects:", len(meta["train_subjects"]))
print("Demo subjects:", meta["demo_subjects"])

# 5. Load the feature table
# 6. Pick one demo subject's rows
# 7. Predict with the loaded model
# 8. Score the predictions

LOSO_MACRO_F1 = {"Bidslab13": 0.656, "Bidslab35": 0.656, "Bidslab60": 0.662, "Bidslab00": 0.740}




df, features, label = DatasetService.load(HERE / "features_v2.csv", classes=3)

for subject in meta["demo_subjects"] + ["Bidslab00"]:
    is_subject = df["subject"] == subject
    demo = df[is_subject]

    X = demo[meta["features"]]
    predicted = model.predict(X)
    scores = ModelService.score(demo[label].values, predicted)
    print(f"{subject}: {len(demo)} epochs | macro-F1 {scores['macro_f1']:.3f} (LOSO {LOSO_MACRO_F1[subject]:.3f}) | accuracy {scores['accuracy']:.3f}") 

