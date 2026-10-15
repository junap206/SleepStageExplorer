"""
make_sample_nights.py

Run once, to turn the three held-out nights into small
JSON files the web app can ship (features + true stages, no raw data).

Usage, from the backend folder:
    python make_sample_nights.py "C:\\path\\to\\your\\data"
"""
import json
import sys
from pathlib import Path

from sleepstager.build_features import build_features
from sleepstager.constants import Constants
from sleepstager.raw_data_service import RawDataService

BACKEND_DIR = Path(__file__).resolve().parent
META_PATH = BACKEND_DIR / "artifacts" / "model_meta.json"
OUT_DIR = BACKEND_DIR / "samples"

# People the model never trained on, so scores on them are honest.
DEMO_SUBJECTS = ["Bidslab13", "Bidslab35", "Bidslab60"]


def make_sample(folder, subject, night, feature_names):
    motion, heart_rate, labels_five, recording_start = RawDataService.load_night(folder)
    n_epochs = len(labels_five)

    # The TRUE recording start (not the one derived from motion) so that
    # epoch k lines up with label k.
    table = build_features(
        motion, heart_rate, recording_start=recording_start, n_epochs=n_epochs)
    table = table[feature_names].round(6)

    # Five EEG stages -> our three classes. Unknown (stage 5) becomes -1,
    # and the scoring code skips those epochs.
    true_stages = [Constants.FIVE_TO_THREE_CLASS.get(int(label), -1)
                   for label in labels_five]

    sample = {
        "subject": subject,
        "night": night,
        "recording_start": float(recording_start),
        "epoch_seconds": Constants.EPOCH_SECONDS,
        "n_epochs": n_epochs,
        "feature_names": feature_names,
        "features": table.values.tolist(),
        "true_stages": true_stages,
    }
    missing = int(table.isna().sum().sum())
    return sample, missing


def main():
    if len(sys.argv) != 2:
        print('Usage: python make_sample_nights.py "C:\\path\\to\\data"')
        return
    data_root = sys.argv[1]

    with open(META_PATH) as file:
        meta = json.load(file)

    OUT_DIR.mkdir(exist_ok=True)
    for subject in DEMO_SUBJECTS:
        nights = RawDataService.find_nights(data_root, subjects=[subject])
        if not nights:
            print(f"{subject}: no night found under {data_root}")
            continue

        folder, subject_name, night = nights[0]
        sample, missing = make_sample(folder, subject_name, night, meta["features"])

        out_path = OUT_DIR / f"{subject.lower()}.json"
        with open(out_path, "w") as file:
            json.dump(sample, file)

        size_kb = out_path.stat().st_size / 1024
        print(f"{subject} night {night}: {sample['n_epochs']} epochs, "
              f"{size_kb:.0f} KB, missing values: {missing}")


main()