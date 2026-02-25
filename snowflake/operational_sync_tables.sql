-- ============================================================================
-- SNOWFLAKE SCHEMA FOR LIVE POSTGRES SYNC
-- ============================================================================
USE DATABASE JALI_ML_DB;
USE SCHEMA RAW;

-- Table to mirror Postgres ovc_cases
CREATE TABLE IF NOT EXISTS RAW.POSTGRES_OVC_CASES (
    case_id INT,
    ovc_id VARCHAR(50),
    caregiver_id VARCHAR(50),
    chv_id VARCHAR(50),
    facility_id VARCHAR(50),
    school_id VARCHAR(50),
    date_of_event DATE,
    date_of_linkage DATE,
    registration_date DATE,
    exit_date DATE,
    art_status VARCHAR(100),
    ccc_number VARCHAR(100),
    duration_on_art VARCHAR(50),
    viral_load VARCHAR(100),
    suppression_status VARCHAR(100),
    immunization_status VARCHAR(100),
    eligibility VARCHAR(100),
    exit_status VARCHAR(100),
    exit_reason TEXT,
    created_at TIMESTAMP_NTZ,
    _synced_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Index-like metadata for incremental tracking
CREATE OR REPLACE VIEW RAW.VW_OVC_CASES_LAST_SYNC AS
SELECT COALESCE(MAX(created_at), '1900-01-01'::TIMESTAMP_NTZ) as last_created_at
FROM RAW.POSTGRES_OVC_CASES;
