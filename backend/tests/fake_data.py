import numpy as np
import pandas as pd


def make_fake_night(seconds=610):
    rng = np.random.default_rng(0)
    start = 1_638_504_000.0
    motion_t = start + np.arange(0, seconds, 0.02)
    motion = pd.DataFrame({
        "t": motion_t,
        "x": rng.normal(0, 0.01, len(motion_t)),
        "y": rng.normal(0, 0.01, len(motion_t)),
        "z": rng.normal(1, 0.01, len(motion_t)),
    })
    hr_t = start + np.arange(0, seconds, 5)
    heart_rate = pd.DataFrame({"t": hr_t, "bpm": 60 + rng.normal(0, 2, len(hr_t))})
    return motion, heart_rate