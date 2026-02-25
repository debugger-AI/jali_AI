"""
Jali MLOps — Retrain Trigger
Called by Airflow and GitHub Actions to check for pending retrains
and invoke snowpark_trainer.py for affected pillars.

Exit codes (for GitHub Actions conditionals):
    0 — no new data, nothing to retrain
    1 — retraining triggered (or --force used)
"""

import os
import sys
import subprocess
import argparse

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from dotenv import load_dotenv
load_dotenv(os.path.join(project_root, ".env"))


def _get_session():
    """Return a Snowpark session using .env credentials."""
    from snowflake.snowpark import Session
    return Session.builder.configs({
        "account":   os.getenv("SNOWFLAKE_ACCOUNT"),
        "user":      os.getenv("SNOWFLAKE_USER"),
        "password":  os.getenv("SNOWFLAKE_PASSWORD"),
        "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE"),
        "database":  os.getenv("SNOWFLAKE_DATABASE"),
        "schema":    "MLOPS",
        "role":      os.getenv("SNOWFLAKE_ROLE", "ACCOUNTADMIN"),
    }).create()


def get_pending_pillars(session) -> list:
    """Query MLOPS.V_PENDING_RETRAINS for unprocessed flags."""
    rows = session.sql(
        "SELECT PILLAR, REASON FROM MLOPS.V_PENDING_RETRAINS"
    ).collect()
    return [(r[0], r[1]) for r in rows]


def mark_flags_processed(session, pillars: list):
    """Mark retrain flags as processed so they are not re-triggered."""
    for pillar in pillars:
        session.sql(f"""
            UPDATE MLOPS.RETRAIN_FLAG
            SET PROCESSED = TRUE
            WHERE PILLAR = '{pillar}' AND PROCESSED = FALSE
        """).collect()


def log_training_run(session, pillar: str, trigger_type: str, git_sha: str):
    """Insert a PENDING row into MLOPS.TRAINING_RUNS."""
    session.sql(f"""
        INSERT INTO MLOPS.TRAINING_RUNS
            (TRIGGER_TYPE, PILLAR, STATUS, GIT_COMMIT_SHA)
        VALUES
            ('{trigger_type}', '{pillar}', 'PENDING', '{git_sha}')
    """).collect()


def run_trainer(pillar: str):
    """Invoke snowpark_trainer.py as a subprocess for the given pillar."""
    trainer_path = os.path.join(project_root, "mlops", "snowpark_trainer.py")
    cmd = [sys.executable, trainer_path, "--source", "snowflake", "--pillar", pillar]
    print(f"   [Trigger] Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode


def check_and_trigger(force: bool = False, force_pillar: str = "all") -> int:
    """
    Main function called by Airflow PythonOperator and GitHub Actions.
    Returns: 0 if nothing to do, 1 if retraining was triggered.
    """
    trigger_type = os.getenv("TRIGGER_TYPE", "stream_trigger")
    git_sha      = os.getenv("GITHUB_SHA", "local")

    try:
        session = _get_session()
    except Exception as e:
        print(f"[Trigger] ERROR: Cannot connect to Snowflake — {e}")
        return 0

    if force:
        pillars_to_run = [(force_pillar, "forced via --force flag")]
        print(f"[Trigger] Force flag set. Retraining pillar: {force_pillar}")
    else:
        pillars_to_run = get_pending_pillars(session)

    if not pillars_to_run:
        print("[Trigger] No pending retrains. All pillars up to date.")
        session.close()
        return 0

    print(f"[Trigger] {len(pillars_to_run)} pillar(s) flagged for retraining:")
    for pillar, reason in pillars_to_run:
        print(f"   → {pillar}: {reason}")

    retrained = []
    for pillar, _ in pillars_to_run:
        log_training_run(session, pillar, trigger_type, git_sha)
        rc = run_trainer(pillar)
        if rc == 0:
            retrained.append(pillar)
            mark_flags_processed(session, [pillar])
        else:
            print(f"   [Trigger] ⚠ Trainer exited with code {rc} for pillar '{pillar}'")

    session.close()
    print(f"[Trigger] Done. Retrained: {retrained}")
    return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Jali MLOps Retrain Trigger")
    parser.add_argument("--force",  action="store_true",
                        help="Force retraining regardless of stream flags")
    parser.add_argument("--pillar", type=str, default="all",
                        help="Pillar to retrain when --force is used (default: all)")
    args = parser.parse_args()

    exit_code = check_and_trigger(force=args.force, force_pillar=args.pillar)
    sys.exit(exit_code)
