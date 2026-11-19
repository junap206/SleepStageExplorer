import json

from export_sample_results import OUT_DIR, build_files


def test_frontend_sample_cache_is_up_to_date():
    # The website serves these precomputed files instead of calling the
    # backend. If the model or a sample night changes, rerun
    # `python export_sample_results.py` from the backend folder.
    for name, text in build_files().items():
        path = OUT_DIR / name
        assert path.exists(), f"{path} is missing; run export_sample_results.py"
        assert json.loads(path.read_text()) == json.loads(text), (
            f"{path} is out of date; run export_sample_results.py")
