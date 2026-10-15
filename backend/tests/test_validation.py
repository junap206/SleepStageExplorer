from app.validation import find_problems
from fake_data import make_fake_night

ONE_NIGHT = 7_210    # a bit over 2 hours of fake data


def mentions(problems, text):
    return any(text in problem for problem in problems)


def test_a_good_night_has_no_problems():
    motion, heart_rate = make_fake_night(seconds=ONE_NIGHT)
    assert find_problems(motion, heart_rate) == []


def test_a_short_recording_is_rejected():
    motion, heart_rate = make_fake_night(seconds=610)
    assert mentions(find_problems(motion, heart_rate), "At least")


def test_the_wrong_sampling_rate_is_rejected():
    motion, heart_rate = make_fake_night(seconds=ONE_NIGHT)
    slow_motion = motion.iloc[::5].reset_index(drop=True)
    assert mentions(find_problems(slow_motion, heart_rate), "readings per second")


def test_the_wrong_units_are_rejected():
    motion, heart_rate = make_fake_night(seconds=ONE_NIGHT)
    motion[["x", "y", "z"]] = motion[["x", "y", "z"]] * 9.81
    assert mentions(find_problems(motion, heart_rate), "not in g")


def test_impossible_heart_rates_are_rejected():
    motion, heart_rate = make_fake_night(seconds=ONE_NIGHT)
    heart_rate["bpm"] = heart_rate["bpm"] * 10
    assert mentions(find_problems(motion, heart_rate), "Heart rate")


def test_heart_rate_from_another_night_is_rejected():
    motion, heart_rate = make_fake_night(seconds=ONE_NIGHT)
    heart_rate["t"] = heart_rate["t"] + 1_000_000
    assert mentions(find_problems(motion, heart_rate), "overlap")