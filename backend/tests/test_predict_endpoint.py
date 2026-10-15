from fastapi.testclient import TestClient

from app.main import app
from fake_data import make_fake_night

client = TestClient(app)


def test_predict_endpoint_returns_a_stage_per_epoch():
    motion, heart_rate = make_fake_night()
    response = client.post("/predict", files={
        "motion_file": ("motion.csv", motion.to_csv(index=False), "text/csv"),
        "hr_file": ("hr.csv", heart_rate.to_csv(index=False), "text/csv"),
    })
    assert response.status_code == 200
    body = response.json()
    assert body["n_epochs"] == 20
    assert len(body["stages"]) == 20
    assert set(body["stages"]) <= {0, 1, 2}


def test_predict_endpoint_rejects_empty_files():
    response = client.post("/predict", files={
        "motion_file": ("motion.csv", "", "text/csv"),
        "hr_file": ("hr.csv", "", "text/csv"),
    })
    assert response.status_code == 400