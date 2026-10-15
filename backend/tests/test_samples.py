from fastapi.testclient import TestClient

from app.main import app
from app.samples import compute_metrics

client = TestClient(app)


def test_metrics_are_perfect_when_predictions_match():
    metrics = compute_metrics([0, 1, 2, 1], [0, 1, 2, 1])
    assert metrics["accuracy"] == 1.0
    assert metrics["macro_f1"] == 1.0
    assert metrics["kappa"] == 1.0


def test_metrics_skip_unknown_epochs():
    metrics = compute_metrics([0, 1, -1], [0, 1, 2])
    assert metrics["n_scored_epochs"] == 2
    assert metrics["accuracy"] == 1.0


def test_sample_list_has_the_three_held_out_people():
    response = client.get("/samples")
    assert response.status_code == 200
    ids = [item["id"] for item in response.json()["samples"]]
    assert ids == ["bidslab13", "bidslab35", "bidslab60"]


def test_sample_night_lines_up():
    body = client.get("/samples/bidslab13").json()
    assert len(body["stages"]) == body["n_epochs"]
    assert len(body["true_stages"]) == body["n_epochs"]
    for name in ("accuracy", "macro_f1", "kappa"):
        assert -1.0 <= body["metrics"][name] <= 1.0


def test_unknown_sample_gives_404():
    assert client.get("/samples/nope").status_code == 404