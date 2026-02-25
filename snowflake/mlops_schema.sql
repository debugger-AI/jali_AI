-- ============================================================================
-- JALI MLOPS SCHEMA — Snowflake Native MLOps Layer
-- Run this once in your Snowflake worksheet to bootstrap the MLOps schema.
-- Repository: https://github.com/debugger-AI/jali.git
-- ============================================================================

USE DATABASE JALI_ML_DB;
USE WAREHOUSE JALI_ML_WH;
USE ROLE ACCOUNTADMIN;

CREATE SCHEMA IF NOT EXISTS MLOPS;

-- ---------------------------------------------------------------------------
-- 1. MODEL REGISTRY
--    One row per trained model version. Status lifecycle:
--    STAGING -> PRODUCTION -> ARCHIVED
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS MLOPS.MODEL_REGISTRY (
    MODEL_ID         NUMBER AUTOINCREMENT PRIMARY KEY,
    PILLAR           VARCHAR(50)  NOT NULL,   -- hiv_adherence | tb_adherence | immunization | menstrual
    MODEL_NAME       VARCHAR(100) NOT NULL,
    MODEL_VERSION    VARCHAR(20)  NOT NULL,   -- e.g. v1.0, v1.1
    STATUS           VARCHAR(20)  NOT NULL DEFAULT 'STAGING',  -- STAGING | PRODUCTION | ARCHIVED
    AUC_SCORE        FLOAT,
    F1_SCORE         FLOAT,
    PRECISION_SCORE  FLOAT,
    RECALL_SCORE     FLOAT,
    TRAINING_ROWS    INTEGER,
    GIT_COMMIT_SHA   VARCHAR(40),
    TRAINED_BY       VARCHAR(50)  DEFAULT 'snowpark_trainer',
    TRAINED_AT       TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    NOTES            VARCHAR(500)
);

-- ---------------------------------------------------------------------------
-- 2. MODEL METRICS — time-series metrics per run (for trend dashboards)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS MLOPS.MODEL_METRICS (
    METRIC_ID     NUMBER AUTOINCREMENT PRIMARY KEY,
    MODEL_ID      INTEGER REFERENCES MLOPS.MODEL_REGISTRY(MODEL_ID),
    PILLAR        VARCHAR(50),
    METRIC_NAME   VARCHAR(50),   -- auc | f1 | precision | recall | training_rows
    METRIC_VALUE  FLOAT,
    LOGGED_AT     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- ---------------------------------------------------------------------------
-- 3. DRIFT MONITOR — PSI scores per feature per run
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS MLOPS.DRIFT_MONITOR (
    DRIFT_ID       NUMBER AUTOINCREMENT PRIMARY KEY,
    MODEL_ID       INTEGER REFERENCES MLOPS.MODEL_REGISTRY(MODEL_ID),
    PILLAR         VARCHAR(50),
    FEATURE_NAME   VARCHAR(100),
    PSI_SCORE      FLOAT,        -- >0.1 = minor drift, >0.2 = significant drift
    DRIFT_STATUS   VARCHAR(20),  -- OK | MINOR | SIGNIFICANT
    CHECKED_AT     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- ---------------------------------------------------------------------------
-- 4. TRAINING RUNS — audit log of every CI/CD triggered run
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS MLOPS.TRAINING_RUNS (
    RUN_ID         NUMBER AUTOINCREMENT PRIMARY KEY,
    TRIGGER_TYPE   VARCHAR(30),   -- github_push | scheduled | manual | stream_trigger
    PILLAR         VARCHAR(50),   -- all | hiv_adherence | tb_adherence | immunization | menstrual
    STATUS         VARCHAR(20),   -- PENDING | RUNNING | SUCCESS | FAILED
    TRIGGERED_AT   TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    COMPLETED_AT   TIMESTAMP_NTZ,
    ERROR_MESSAGE  VARCHAR(2000),
    GIT_COMMIT_SHA VARCHAR(40)
);

-- Flag for Airflow/CI to detect pending retrains
CREATE TABLE IF NOT EXISTS MLOPS.RETRAIN_FLAG (
    FLAG_ID        NUMBER AUTOINCREMENT PRIMARY KEY,
    PILLAR         VARCHAR(50),
    REASON         VARCHAR(200),
    FLAGGED_AT     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PROCESSED      BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------------------------
-- 5. SNOWFLAKE GIT REPOSITORY INTEGRATION
--    Connects Snowflake to your GitHub repo natively.
--    After running this: Objects under the git branch become importable
--    as Snowflake stored procedures and UDFs.
-- ---------------------------------------------------------------------------
-- NOTE: First create an API integration for GitHub if not done yet.
CREATE API INTEGRATION IF NOT EXISTS JALI_GITHUB_API
    API_PROVIDER = git_https_api
    API_ALLOWED_PREFIXES = ('https://github.com/debugger-AI/')
    ENABLED = TRUE;

-- Create the Git Repository object (requires a SECRET for private repos)
-- If repo is public, omit the GIT_CREDENTIALS clause.
CREATE OR REPLACE GIT REPOSITORY MLOPS.JALI_REPO
    API_INTEGRATION = JALI_GITHUB_API
    ORIGIN = 'https://github.com/debugger-AI/jali.git';

-- Fetch latest from GitHub (run after any git push)
-- ALTER GIT REPOSITORY MLOPS.JALI_REPO FETCH;

-- ---------------------------------------------------------------------------
-- 6. AUTO-RETRAIN TASK
--    Polls RAW streams every hour. If any stream has new data, inserts a
--    RETRAIN_FLAG row which Airflow / GitHub Actions will pick up.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TASK MLOPS.TSK_AUTO_RETRAIN_FLAG
    WAREHOUSE = JALI_ML_WH
    SCHEDULE  = 'USING CRON 0 * * * * UTC'   -- every hour at :00
AS
INSERT INTO MLOPS.RETRAIN_FLAG (PILLAR, REASON)
SELECT v.PILLAR, v.REASON
FROM (
    SELECT 'hiv_adherence'  AS PILLAR, 'New HIV stream data'       AS REASON
    WHERE SYSTEM$STREAM_HAS_DATA('RAW.HIV_ADHERENCE_STREAM')
    UNION ALL
    SELECT 'tb_adherence',  'New TB stream data'
    WHERE SYSTEM$STREAM_HAS_DATA('RAW.CRT_STREAM')
    UNION ALL
    SELECT 'menstrual',     'New menstrual stream data'
    WHERE SYSTEM$STREAM_HAS_DATA('RAW.FEDCYCLE_STREAM')
    UNION ALL
    SELECT 'immunization',  'New OVC stream data'
    WHERE SYSTEM$STREAM_HAS_DATA('RAW.POSTGRES_OVC_STREAM')
) v
WHERE NOT EXISTS (
    -- Avoid duplicate flags for the same pillar if already unprocessed
    SELECT 1 FROM MLOPS.RETRAIN_FLAG
    WHERE PILLAR = v.PILLAR AND PROCESSED = FALSE
);

-- Resume the task so it starts running on schedule
ALTER TASK MLOPS.TSK_AUTO_RETRAIN_FLAG RESUME;
