from fastapi.testclient import TestClient

from app.main import app
from fake_data import make_fake_night

client = TestClient(app)


def post_night(motion, heart_rate):
    return client.post("/predict", files={
        "motion_file": ("motion.csv", motion.to_csv(index=False), "text/csv"),
        "hr_file": ("hr.csv", heart_rate.to_csv(index=False), "text/csv"),
    })


def test_predict_endpoint_returns_a_stage_per_epoch():
    motion, heart_rate = make_fake_night(seconds=7_210)
    response = post_night(motion, heart_rate)
    assert response.status_code == 200
    body = response.json()
    assert body["n_epochs"] == 240
    assert len(body["stages"]) == 240
    assert set(body["stages"]) <= {0, 1, 2}


def test_predict_endpoint_rejects_empty_files():
    response = client.post("/predict", files={
        "motion_file": ("motion.csv", "", "text/csv"),
        "hr_file": ("hr.csv", "", "text/csv"),
    })
    assert response.status_code == 400


def test_predict_endpoint_explains_a_too_short_recording():
    motion, heart_rate = make_fake_night(seconds=610)
    response = post_night(motion, heart_rate)
    assert response.status_code == 400
    assert any("At least" in problem for problem in response.json()["detail"])