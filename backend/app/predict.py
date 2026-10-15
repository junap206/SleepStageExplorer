from sleepstager.build_features import build_features

# raw signals in, sleep stages out per column of the table 

def predict_stages(model, meta, motion, heart_rate):
    table = build_features(motion, heart_rate)
    X = table[meta["features"]]
    stages = model.predict(X)
    return stages.tolist()  # xgboost gives numpy array, but the web api needs json, so we convert to a list