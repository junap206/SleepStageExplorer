# 1. Imports and file paths
# 2. Load the feature table
# 3. Remove the demo subjects (and prove they're gone)
# 4. Train the model with the tuned settings
# 5. Save the model
# 6. Save the metadata

import json
from datetime import datetime, timezone
from pathlib import Path

import xgboost

from constants import Constants
from dataset_service import DatasetService
from model_service import ModelService

HERE = Path(__file__).resolve().parent
FEATURES_PATH = HERE / "features_v2.csv"
PARAMS_PATH = HERE / "xgb_best_params.json"
ARTIFACTS_DIR = HERE.parent / "backend" / "artifacts"

DEMO_SUBJECTS = ["Bidslab13", "Bidslab35", "Bidslab60"]

print("Features file:", FEATURES_PATH, FEATURES_PATH.exists())
print("Params file:  ", PARAMS_PATH, PARAMS_PATH.exists())

df, features, label = DatasetService.load(FEATURES_PATH, classes=3)
print(f"Loaded {len(df):,} epochs, {len(features)} features, {df['subject'].nunique()} subjects")

is_demo = df["subject"].isin(DEMO_SUBJECTS)
train = df[~is_demo]

assert not train["subject"].isin(DEMO_SUBJECTS).any(), print("Training subjects:", train["subject"].nunique())

#model building and training
params = ModelService.load_params(PARAMS_PATH)
model = ModelService.build(params)
print("training subjects:", train["subject"].nunique())
model.fit(train[features], train[label])
print("Done. Trees:", params["n_estimators"])

#save the model
ARTIFACTS_DIR.mkdir(exist_ok=True)
model.save_model(ARTIFACTS_DIR / "xgb_model.json")
print("Saved model to", ARTIFACTS_DIR / "xgb_model.json")

#save the metadata
meta = {"features": features,
        "n_features": len(features),
        "stage_names" : Constants.STAGE_NAMES,
        "demo_subjects": DEMO_SUBJECTS,
        "train_subjects": sorted(train["subject"].unique()),
        "xgboost_version": xgboost.__version__,
        "params": params,
        "created": datetime.now(timezone.utc).isoformat()
        }

with open(ARTIFACTS_DIR / "model_meta.json", "w") as file:
    json.dump(meta, file, indent=2)
print("saved metadata to", ARTIFACTS_DIR / "model_meta.json")