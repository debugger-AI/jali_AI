"""
Jali MLOps — Snowpark Training Engine
Trains all 4 health pillars natively inside Snowflake using Snowpark ML.
Reads from FEATURES.* views, trains, registers models, and logs drift.

Usage:
    python mlops/snowpark_trainer.py --source snowflake --pillar all
    python mlops/snowpark_trainer.py --source snowflake --pillar hiv --dry-run
"""

import os
import sys
import argparse
import pandas as pd
from datetime import datetime, timezone

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from dotenv import load_dotenv
load_dotenv(os.path.join(project_root, ".env"))

from mlops.model_registry import register_model, promote_to_production
from mlops.drift_monitor import compute_and_log_drift

# ---------------------------------------------------------------------------
# Pillar configuration: feature tables, features, target, estimator class
# ---------------------------------------------------------------------------
PILLAR_CONFIG = {
    "hiv_adherence": {
        "display":          "HIV Adherence",
        "feature_table":    "FEATURES.UNIFIED_ADHERENCE_STORE",
        "filter":           "DISEASE_TYPE = 'HIV'",
        "numeric_features": ["ADHERENCE_SCORE", "BARRIERS_SCORE"],
        "cat_features":     ["GENDER", "AGE_GROUP"],
        "target":           "ADHERENCE_SCORE",   # binary: >=0.5 = adherent
        "estimator":        "XGBClassifier",
    },
    "tb_adherence": {
        "display":          "TB Adherence",
        "feature_table":    "FEATURES.UNIFIED_ADHERENCE_STORE",
        "filter":           "DISEASE_TYPE = 'TB'",
        "numeric_features": ["ADHERENCE_SCORE", "BARRIERS_SCORE"],
        "cat_features":     ["GENDER", "AGE_GROUP"],
        "target":           "ADHERENCE_SCORE",
        "estimator":        "XGBClassifier",
    },
    "menstrual": {
        "display":          "Menstrual Tracking",
        "feature_table":    "FEATURES.FERTILITY_STORE",
        "filter":           None,
        "numeric_features": ["AGE", "BMI", "CYCLE_LENGTH"],
        "cat_features":     [],
        "target":           "HAS_PEAK_OVULATION",
        "estimator":        "LogisticRegression",
    },
    "immunization": {
        "display":          "Immunization Tracker",
        "feature_table":    "FEATURES.UNIFIED_ADHERENCE_STORE",
        "filter":           "DISEASE_TYPE = 'OVC_LIVE'",
        "numeric_features": ["ADHERENCE_SCORE"],
        "cat_features":     [],
        "target":           "ADHERENCE_SCORE",
        "estimator":        "XGBClassifier",
    },
}

ALL_PILLARS = list(PILLAR_CONFIG.keys())


def _get_session():
    """Create and return a Snowflake Snowpark session."""
    from snowflake.snowpark import Session
    return Session.builder.configs({
        "account":   os.getenv("SNOWFLAKE_ACCOUNT"),
        "user":      os.getenv("SNOWFLAKE_USER"),
        "password":  os.getenv("SNOWFLAKE_PASSWORD"),
        "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE"),
        "database":  os.getenv("SNOWFLAKE_DATABASE"),
        "schema":    "FEATURES",
        "role":      os.getenv("SNOWFLAKE_ROLE", "ACCOUNTADMIN"),
    }).create()


def _load_data(session, config: dict) -> pd.DataFrame:
    """Load feature data from Snowflake into a pandas DataFrame."""
    table  = config["feature_table"]
    where  = f"WHERE {config['filter']}" if config.get("filter") else ""
    query  = f"SELECT * FROM {table} {where}"
    return session.sql(query).to_pandas()


def _build_estimator(estimator_name: str):
    """Return a configured Snowpark ML estimator."""
    from snowflake.ml.modeling.xgboost import XGBClassifier
    from snowflake.ml.modeling.linear_model import LogisticRegression

    if estimator_name == "XGBClassifier":
        return XGBClassifier(
            input_cols=None,   # set at train time
            label_cols=None,
            n_estimators=100,
            learning_rate=0.05,
            max_depth=4,
            random_state=42,
        )
    elif estimator_name == "LogisticRegression":
        return LogisticRegression(
            input_cols=None,
            label_cols=None,
            max_iter=200,
            random_state=42,
        )
    else:
        raise ValueError(f"Unknown estimator: {estimator_name}")


def _train_pillar(session, pillar: str, config: dict, dry_run: bool, git_sha: str):
    """Full training cycle for a single pillar."""
    display = config["display"]
    print(f"\n{'='*60}")
    print(f"[PILLAR] {display}")
    print(f"{'='*60}")

    # 1. Load data
    df = _load_data(session, config)
    print(f"   Loaded {len(df):,} rows from {config['feature_table']}")

    if dry_run:
        print(f"   [DRY-RUN] Skipping training. Shape: {df.shape}  Columns: {list(df.columns)}")
        return

    if len(df) < 20:
        print(f"   ⚠ Insufficient data ({len(df)} rows). Skipping {display}.")
        return

    # 2. Prepare features and target
    num_feats = [c for c in config["numeric_features"] if c in df.columns]
    cat_feats = [c for c in config["cat_features"]     if c in df.columns]
    target    = config["target"]

    if target not in df.columns:
        print(f"   ⚠ Target column '{target}' not found. Skipping.")
        return

    # Binarise continuous target: >= median = 1, else 0
    if df[target].nunique() > 2:
        median = df[target].median()
        df["__TARGET__"] = (df[target] >= median).astype(int)
        target = "__TARGET__"

    all_feature_cols = num_feats + cat_feats
    if not all_feature_cols:
        print(f"   ⚠ No usable features found. Skipping.")
        return

    df = df.dropna(subset=[target])
    df[num_feats] = df[num_feats].fillna(0)
    df[cat_feats] = df[cat_feats].fillna("Unknown")

    # 3. Convert to Snowpark DataFrame for native training
    snowpark_df = session.create_dataframe(df[all_feature_cols + [target]])

    from sklearn.model_selection import train_test_split
    from sklearn.metrics import roc_auc_score, f1_score, precision_score, recall_score

    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)

    # 4. Train using Snowpark ML estimator
    estimator = _build_estimator(config["estimator"])
    estimator.set_input_cols(all_feature_cols)
    estimator.set_label_cols([target])
    estimator.set_output_cols(["PREDICTION"])

    estimator.fit(session.create_dataframe(train_df[all_feature_cols + [target]]))
    print(f"   ✅ Training complete ({len(train_df):,} train rows)")

    # 5. Evaluate
    preds_sdf = estimator.predict(session.create_dataframe(test_df[all_feature_cols + [target]]))
    preds_df  = preds_sdf.to_pandas()
    y_true    = preds_df[target.upper()]
    y_pred    = preds_df["PREDICTION"]

    try:
        y_prob = preds_df.get("PREDICTION_PROBA_1", y_pred)
        auc    = roc_auc_score(y_true, y_prob)
    except Exception:
        auc    = 0.0

    f1        = f1_score(y_true, y_pred, zero_division=0)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall    = recall_score(y_true, y_pred, zero_division=0)

    metrics = {
        "auc": auc, "f1": f1,
        "precision": precision, "recall": recall,
        "training_rows": len(train_df)
    }
    print(f"   AUC={auc:.4f}  F1={f1:.4f}  Precision={precision:.4f}  Recall={recall:.4f}")

    # 6. Register model and promote if AUC improved
    model_id = register_model(session, pillar, metrics, git_sha)
    promote_to_production(session, pillar, model_id)

    # 7. Drift check
    baseline_sample = df.sample(min(1000, len(df)), random_state=0)
    compute_and_log_drift(session, model_id, pillar,
                          baseline_sample, train_df, num_feats)


def run_pipeline(pillars: list, dry_run: bool = False):
    """Entry point — trains the specified pillars sequentially."""
    git_sha = os.getenv("GITHUB_SHA", "local")
    print(f"\n{'#'*60}")
    print(f"  JALI SNOWPARK ML PIPELINE")
    print(f"  Pillars: {pillars}  |  Dry-run: {dry_run}")
    print(f"  Git SHA: {git_sha}")
    print(f"{'#'*60}")

    session = _get_session()
    try:
        for pillar in pillars:
            if pillar not in PILLAR_CONFIG:
                print(f"[WARNING] Unknown pillar '{pillar}' — skipping.")
                continue
            try:
                _train_pillar(session, pillar, PILLAR_CONFIG[pillar], dry_run, git_sha)
            except Exception as e:
                print(f"   [ERROR] Pillar '{pillar}' failed: {e}")
    finally:
        session.close()
        print(f"\n[Done] Pipeline complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Jali Snowpark ML Pipeline")
    parser.add_argument(
        "--source", type=str, default="snowflake", choices=["snowflake"],
        help="Data source (always snowflake for this engine)"
    )
    parser.add_argument(
        "--pillar", type=str, default="all",
        help=f"Pillar to train: all | {' | '.join(ALL_PILLARS)}"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Read data and print shapes without training"
    )
    args = parser.parse_args()

    pillars = ALL_PILLARS if args.pillar == "all" else [args.pillar]
    run_pipeline(pillars, dry_run=args.dry_run)
