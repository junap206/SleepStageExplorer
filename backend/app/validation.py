import numpy as np

MIN_HOURS = 1
MAX_HOURS = 16
MIN_MOTION_HZ = 40
MAX_MOTION_HZ = 70
MIN_TYPICAL_G = 0.7
MAX_TYPICAL_G = 1.3
MIN_BPM = 30
MAX_BPM = 200
MAX_UPLOAD_BYTES = 200 * 1024 * 1024    # 200 MB per file


def find_problems(motion, heart_rate):
    """Return a list of plain English problems with an upload. An empty list means it looks fine."""
    if len(motion) < 2 or len(heart_rate) < 2:
        return ["Each file needs at least two readings."]

    problems = []
    start = motion["t"].iloc[0]
    end = motion["t"].iloc[-1]
    hours = (end - start) / 3600

    if hours < MIN_HOURS:
        problems.append(f"The motion recording is {hours:.1f} hours long. At least {MIN_HOURS} hour is needed.")
    if hours > MAX_HOURS:
        problems.append(f"The motion recording is {hours:.1f} hours long. The limit is {MAX_HOURS} hours.")

    if end > start:
        readings_per_second = (len(motion) - 1) / (end - start)
        if not MIN_MOTION_HZ <= readings_per_second <= MAX_MOTION_HZ:
            problems.append(
                f"Motion has about {readings_per_second:.0f} readings per second. This model needs about 50.")
    else:
        problems.append("Motion timestamps do not advance.")

    magnitude = np.sqrt(motion["x"] ** 2 + motion["y"] ** 2 + motion["z"] ** 2)
    typical_g = magnitude.median()
    if not MIN_TYPICAL_G <= typical_g <= MAX_TYPICAL_G:
        problems.append(
            f"Motion values look like they are not in g (typical size {typical_g:.2f}, expected about 1).")

    typical_bpm = heart_rate["bpm"].median()
    if not MIN_BPM <= typical_bpm <= MAX_BPM:
        problems.append(f"Heart rate values look wrong (typical value {typical_bpm:.0f} bpm).")

    inside = ((heart_rate["t"] >= start) & (heart_rate["t"] <= end)).sum()
    n_epochs = int((end - start) / 30)
    if inside < n_epochs:
        problems.append("The heart-rate readings do not overlap the motion recording. Are they from the same night?")

    return problems