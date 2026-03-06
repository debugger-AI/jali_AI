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

-- 3. DRIFT OBSERVABILITY (DATA STABILITY)
-- Check if the distribution of incoming data has shifted significantly.
-- PSI > 0.1:  [MINOR]     Monitor the feature, might be seasonal.
-- PSI > 0.25: [CRITICAL]  Retain the model immediately!
SELECT 
    PILLAR, 
    FEATURE_NAME, 
    PSI_SCORE, 
    DRIFT_STATUS as SEVERITY, 
    MEASURED_AT
FROM MLOPS.V_DRIFT_ALERTS
ORDER BY MEASURED_AT DESC;

-- Proactive SQL for identifying the "Wobblies" (Features drifting most)
SELECT 
    FEATURE_NAME, 
    AVG(PSI_SCORE) as AVG_DRIFT,
    COUNT(*) as ALERTS_COUNT
FROM MLOPS.DRIFT_MONITOR
WHERE DRIFT_STATUS != 'OK'
GROUP BY 1 ORDER BY 2 DESC;

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
