import json
from functools import lru_cache
from pathlib import Path

import numpy as np
from sklearn.metrics import accuracy_score, cohen_kappa_score, f1_score

SAMPLES_DIR = Path(__file__).resolve().parent.parent / "samples"


def list_sample_ids():
    return sorted(path.stem for path in SAMPLES_DIR.glob("*.json"))


@lru_cache(maxsize=None)
def load_sample(sample_id):
    # Only ids that really exist as files are allowed. Never build a file
    # path straight from what the visitor typed in the URL.
    if sample_id not in list_sample_ids():
        return None
    with open(SAMPLES_DIR / f"{sample_id}.json") as file:
        return json.load(file)


def list_samples():
    items = []
    for sample_id in list_sample_ids():
        data = load_sample(sample_id)
        hours = data["n_epochs"] * data["epoch_seconds"] / 3600
        items.append({"id": sample_id, "n_epochs": data["n_epochs"],
                      "hours": round(hours, 1)})
    return items


def compute_metrics(true_stages, predicted_stages):
    true = np.array(true_stages)
    predicted = np.array(predicted_stages)

    known = true >= 0  # skip epochs the EEG experts could not label
    true, predicted = true[known], predicted[known]

    return {
        "n_scored_epochs": int(known.sum()),
        "accuracy": float(accuracy_score(true, predicted)),
        "macro_f1": float(f1_score(true, predicted, average="macro")),
        "kappa": float(cohen_kappa_score(true, predicted)),
    }