import pandas as pd

from .heart_rate_feature_service import HeartRateFeatureService
from .motion_feature_service import MotionFeatureService
from .time_feature_service import TimeFeatureService
from .context_feature_service import ContextFeatureService
from .recording_window import get_recording_window


def build_features(motion, heart_rate, recording_start=None, n_epochs=None):
    if recording_start is None or n_epochs is None:
        recording_start, n_epochs = get_recording_window(motion)

    heart_rate_features = HeartRateFeatureService.build(
        heart_rate, n_epochs=n_epochs, recording_start=recording_start)
    motion_features = MotionFeatureService.build(
        motion, n_epochs=n_epochs, recording_start=recording_start)
    time_features = TimeFeatureService.build(
        n_epochs=n_epochs, recording_start=recording_start)

    table = pd.concat([heart_rate_features, motion_features, time_features], axis=1)
    table = ContextFeatureService.add(table)
    return table