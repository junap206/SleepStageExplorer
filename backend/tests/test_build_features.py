import numpy as np
import pandas as pd

from sleepstager.build_features import build_features


def make_fake_night():
    rng = np.random.default_rng(0)
    start = 1_638_504_000.0
    motion_t = start + np.arange(0, 610, 0.02)      # 610 s of motion at 50 Hz
    motion = pd.DataFrame({
        "t": motion_t,
        "x": rng.normal(0, 0.01, len(motion_t)),
        "y": rng.normal(0, 0.01, len(motion_t)),
        "z": rng.normal(1, 0.01, len(motion_t)),
    })
    hr_t = start + np.arange(0, 610, 5)             # one heart-rate reading every 5 s
    heart_rate = pd.DataFrame({"t": hr_t, "bpm": 60 + rng.normal(0, 2, len(hr_t))})
    return motion, heart_rate


def test_build_features_shape():
    motion, heart_rate = make_fake_night()
    table = build_features(motion, heart_rate)
    assert table.shape == (20, 68)