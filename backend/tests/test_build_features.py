from fake_data import make_fake_night

from sleepstager.build_features import build_features


def test_build_features_shape():
    motion, heart_rate = make_fake_night()
    table = build_features(motion, heart_rate)
    assert table.shape == (20, 68)
