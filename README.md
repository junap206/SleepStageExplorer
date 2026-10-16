# Sleep Stage Prediction Model

Estimates **Wake, NREM and REM sleep** from wrist movement and heart rate.

**https://sleep-stage-explorer.vercel.app**



<img width="620" height="400" alt="image" src="https://github.com/user-attachments/assets/139daaf8-b466-4d89-a49b-465ef3782d11" />


## What you can do

- **Explore a sample night.** Open one of three nights the model has never seen and compare its prediction, minute by minute, with the stages scored by experts from brain (EEG) recordings.
- **Try your own night.** Upload a motion file and a heart-rate file from your own Apple Watch and get the model's estimate for your night.


## How it works

1. Take wrist movement and heart rate for one night.
2. Cuts the night into **30-second windows**.
3. For each window, works out custom features: heart-rate features, movement features, how far into the night it is, and what the neighbouring windows looked like.
4. An **XGBoost** model picks one of three stages for every window: Wake, NREM or REM.


## Privacy

Uploaded files are used once to make the estimate and are not stored. No health data is kept in this repository. The three sample nights are numeric features from an open-access dataset.


## Built with
- **Model Tools** Python, NumPy, SciPy, Xgboost, scikit-learn, Optuna.
- **Site Tools.** Next.js, React, FastAPI, Recharts, Render, Vercel


## Data and credit

The sample nights and the model's training data come from this open dataset, used under the [Open Data Commons Attribution License v1.0](https://opendatacommons.org/licenses/by/1-0/):

> Song, T.-A., Zhang, Y., Zhou, Z., Hou, L., Malekzadeh, M., Behzad, A., & Dutta, J. (2025). AI-driven sleep staging using instantaneous heart rate and accelerometry: Insights from an Apple Watch study. *IEEE Transactions on Biomedical Engineering*. https://doi.org/10.1109/TBME.2025.3612158



