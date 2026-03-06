"""
Jali MLOps — Data Drift Monitor
Computes Population Stability Index (PSI) between baseline and current
data distributions. Logs results to MLOPS.DRIFT_MONITOR in Snowflake.
"""

import numpy as np
import pandas as pd


# PSI thresholds
PSI_MINOR       = 0.1   # yellow: minor drift, monitor
PSI_SIGNIFICANT = 0.2   # red: significant drift, retrain recommended


def _psi_score(baseline: np.ndarray, current: np.ndarray, bins: int = 10) -> float:
    """
    Calculate PSI between a baseline distribution and a current distribution.
    PSI = sum((current% - baseline%) * ln(current% / baseline%))
    """
    # Bin edges from baseline
    _, bin_edges = np.histogram(baseline, bins=bins)
    bin_edges[0]  = -np.inf
    bin_edges[-1] =  np.inf

    baseline_counts, _ = np.histogram(baseline, bins=bin_edges)
    current_counts, _  = np.histogram(current,  bins=bin_edges)

    # Proportions (avoid zero division)
    baseline_pct = np.where(baseline_counts == 0, 0.0001, baseline_counts / len(baseline))
    current_pct  = np.where(current_counts  == 0, 0.0001, current_counts  / len(current))

    psi = np.sum((current_pct - baseline_pct) * np.log(current_pct / baseline_pct))
    return float(psi)


def _drift_status(psi: float) -> str:
    if psi > PSI_SIGNIFICANT:
        return "SIGNIFICANT"
    elif psi > PSI_MINOR:
        return "MINOR"
    return "OK"


def compute_and_log_drift(session, model_id: int, pillar: str,
                           baseline_df: pd.DataFrame, current_df: pd.DataFrame,
                           numeric_features: list):
    """
    Compute PSI for each numeric feature and write results to MLOPS.DRIFT_MONITOR.

    Args:
        session          : active Snowpark session
        model_id         : MODEL_ID from MLOPS.MODEL_REGISTRY
        pillar           : pillar name (hiv_adherence, tb_adherence, etc.)
        baseline_df      : DataFrame used during original training
        current_df       : Latest data window from Snowflake
        numeric_features : list of numeric column names to check
    """
    print(f"   [Drift] Computing PSI for {len(numeric_features)} features ({pillar})...")
    drift_results = []

    for feature in numeric_features:
        if feature not in baseline_df.columns or feature not in current_df.columns:
            continue

        baseline_vals = baseline_df[feature].dropna().values
        current_vals  = current_df[feature].dropna().values

        if len(baseline_vals) < 10 or len(current_vals) < 10:
            continue  # Not enough data for meaningful PSI

        psi    = _psi_score(baseline_vals, current_vals)
        status = _drift_status(psi)
        drift_results.append((feature, psi, status))

        if status != "OK":
            print(f"   [Drift] [WARNING] {feature}: PSI={psi:.4f} ({status})")

    # Write all results to Snowflake
    for feature, psi, status in drift_results:
        session.sql(f"""
            INSERT INTO MLOPS.DRIFT_MONITOR
                (MODEL_ID, PILLAR, FEATURE_NAME, PSI_SCORE, DRIFT_STATUS)
            VALUES
                ({model_id}, '{pillar}', '{feature}', {round(psi, 6)}, '{status}')
        """).collect()

    significant = [r for r in drift_results if r[2] == "SIGNIFICANT"]
    if significant:
        print(f"   [Drift] [ERROR] {len(significant)} features with significant drift in '{pillar}'.")
        print(f"   [Drift]    Retraining is strongly recommended.")
    else:
        print(f"   [Drift] [SUCCESS] No significant drift detected for '{pillar}'.")

    return drift_results
