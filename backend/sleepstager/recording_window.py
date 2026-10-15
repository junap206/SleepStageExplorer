from .constants import Constants

def get_recording_window(motion):
    start = motion["t"].min()
    duration = motion["t"].max() - start
    n_epochs = int(duration / Constants.EPOCH_SECONDS)
    return start, n_epochs

