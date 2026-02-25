-- ============================================================================
-- JALI MLOPS — Monitoring Views
-- Dashboard-ready views for model performance and drift tracking.
-- ============================================================================

USE DATABASE JALI_ML_DB;
USE SCHEMA MLOPS;

-- ---------------------------------------------------------------------------
-- V1: Latest model performance per pillar (with delta vs previous run)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW MLOPS.V_LATEST_MODEL_PERFORMANCE AS
WITH ranked AS (
    SELECT
        PILLAR,
        MODEL_VERSION,
        AUC_SCORE,
        F1_SCORE,
        PRECISION_SCORE,
        RECALL_SCORE,
        TRAINING_ROWS,
        STATUS,
        GIT_COMMIT_SHA,
        TRAINED_AT,
        ROW_NUMBER() OVER (PARTITION BY PILLAR ORDER BY TRAINED_AT DESC) AS rn
    FROM MLOPS.MODEL_REGISTRY
)
SELECT
    curr.PILLAR,
    curr.MODEL_VERSION                                         AS CURRENT_VERSION,
    curr.AUC_SCORE                                             AS CURRENT_AUC,
    prev.AUC_SCORE                                             AS PREVIOUS_AUC,
    ROUND(curr.AUC_SCORE - COALESCE(prev.AUC_SCORE, curr.AUC_SCORE), 4) AS AUC_DELTA,
    curr.F1_SCORE,
    curr.PRECISION_SCORE,
    curr.RECALL_SCORE,
    curr.TRAINING_ROWS,
    curr.STATUS,
    curr.GIT_COMMIT_SHA,
    curr.TRAINED_AT
FROM ranked curr
LEFT JOIN ranked prev
    ON curr.PILLAR = prev.PILLAR AND prev.rn = 2
WHERE curr.rn = 1;

-- ---------------------------------------------------------------------------
-- V2: Drift alerts — features where PSI > 0.1 in the latest run
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW MLOPS.V_DRIFT_ALERTS AS
WITH latest_run AS (
    SELECT PILLAR, MAX(CHECKED_AT) AS MAX_TS
    FROM MLOPS.DRIFT_MONITOR
    GROUP BY PILLAR
)
SELECT
    d.PILLAR,
    d.FEATURE_NAME,
    d.PSI_SCORE,
    d.DRIFT_STATUS,
    d.CHECKED_AT,
    CASE
        WHEN d.PSI_SCORE > 0.2 THEN '🔴 SIGNIFICANT — Retrain recommended'
        WHEN d.PSI_SCORE > 0.1 THEN '🟡 MINOR — Monitor closely'
        ELSE '🟢 STABLE'
    END AS ACTION_REQUIRED
FROM MLOPS.DRIFT_MONITOR d
JOIN latest_run l
    ON d.PILLAR = l.PILLAR AND d.CHECKED_AT = l.MAX_TS
ORDER BY d.PSI_SCORE DESC;

-- ---------------------------------------------------------------------------
-- V3: Training history — full timeline per pillar for trend charts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW MLOPS.V_TRAINING_HISTORY AS
SELECT
    r.MODEL_ID,
    r.PILLAR,
    r.MODEL_VERSION,
    r.AUC_SCORE,
    r.F1_SCORE,
    r.TRAINING_ROWS,
    r.STATUS,
    r.TRAINED_AT,
    r.GIT_COMMIT_SHA,
    t.TRIGGER_TYPE,
    t.STATUS AS RUN_STATUS
FROM MLOPS.MODEL_REGISTRY r
LEFT JOIN MLOPS.TRAINING_RUNS t
    ON r.GIT_COMMIT_SHA = t.GIT_COMMIT_SHA AND r.PILLAR = t.PILLAR
ORDER BY r.PILLAR, r.TRAINED_AT DESC;

-- ---------------------------------------------------------------------------
-- V4: Pending retrain flags (used by Airflow / CI to decide what to retrain)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW MLOPS.V_PENDING_RETRAINS AS
SELECT
    FLAG_ID,
    PILLAR,
    REASON,
    FLAGGED_AT
FROM MLOPS.RETRAIN_FLAG
WHERE PROCESSED = FALSE
ORDER BY FLAGGED_AT ASC;
