-- ============================================================
-- JALI MLOps: EXPERT MONITORING & OBSERVABILITY GUIDE
-- Use this script to track model health, performance, and drift.
-- ============================================================

-- 1. VIEW NATIVE MODEL REGISTRY
-- This shows all models registered in the official Snowflake Model Registry.
SHOW MODELS IN SCHEMA MLOPS;

-- 2. LATEST PRODUCTION MODEL PERFORMANCE
-- The main dashboard view for health pillars.
SELECT 
    PILLAR, 
    CURRENT_VERSION, 
    CURRENT_AUC, 
    LAST_RETRAINED
FROM MLOPS.V_LATEST_MODEL_PERFORMANCE
ORDER BY LAST_RETRAINED DESC;

-- 3. DATA DRIFT ALERTS (PSI)
-- Check if the distribution of incoming data has shifted significantly.
-- PSI > 0.1 indicates a warning, PSI > 0.25 indicates a critical drift.
SELECT 
    PILLAR, 
    FEATURE_NAME, 
    PSI_SCORE, 
    STATUS, 
    MEASURED_AT
FROM MLOPS.DRIFT_MONITOR
WHERE STATUS != 'OK'
ORDER BY MEASURED_AT DESC;

-- 4. TRAINING HISTORY & AUDIT LOG
-- Track how your models have evolved over time.
SELECT 
    PILLAR, 
    MODEL_VERSION, 
    AUC_SCORE, 
    TRAINING_ROWS, 
    STATUS, 
    TRAINED_AT
FROM MLOPS.MODEL_REGISTRY
ORDER BY TRAINED_AT DESC;

-- 5. TRIGGER HISTORY
-- See when retraining was triggered and why (e.g., Stream data, Manual, CI).
SELECT 
    PILLAR, 
    TRIGGER_TYPE, 
    STATUS, 
    STARTED_AT, 
    FINISHED_AT
FROM MLOPS.TRAINING_RUNS
ORDER BY STARTED_AT DESC;

-- 6. KEY FEATURE IMPORTANCE (EXAMPLE FOR HIV)
-- Note: This requires the model to be loaded; Snowflake ML UI provides this visually.
-- Go to: AI & ML > Models > JALI_HIV_ADHERENCE > [Version] to see visual charts.
