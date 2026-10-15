@echo off
REM ======================================================================
REM  run_all_personalization.bat
REM  Every personalization experiment, ONE methodology:
REM    - 3 donors per subject (same donors for a subject in every run)
REM    - XGBoost with tuned params from xgb_best_params.json
REM    - first-K night order unless stated
REM  Safe to stop and restart: each run resumes from its _partial.csv.
REM  Run from PowerShell with:   .\run_all_personalization.bat
REM ======================================================================

echo [1/9] all features
python run_personalization_v2.py --feature-set all --donors 3 --tag final_all

echo [2/9] all features, real-time
python run_personalization_v2.py --feature-set all --realtime --donors 3 --tag final_realtime

echo [3/9] all features, random night order
python run_personalization_v2.py --feature-set all --order random --donors 3 --tag final_random

echo [4/9] Walch features
python run_personalization_v2.py --features walch_features.csv --donors 3 --tag final_walch

echo [5/9] personal-reference features only
python run_personalization_v2.py --feature-set personal --donors 3 --tag final_personal

echo [6/9] non-personal features only
python run_personalization_v2.py --feature-set nonpersonal --donors 3 --tag final_nonpersonal

echo [7/9] heart rate only
python run_personalization_v2.py --feature-set hr --donors 3 --tag final_hr

echo [8/9] motion only
python run_personalization_v2.py --feature-set motion --donors 3 --tag final_motion

echo [9/9] heart rate + motion
python run_personalization_v2.py --feature-set hr_motion --donors 3 --tag final_hrmotion

echo.
echo ALL DONE.
