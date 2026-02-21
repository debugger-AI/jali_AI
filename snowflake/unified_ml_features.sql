-- unify_jali_data.sql
-- This script creates the Unified Feature Store in Snowflake
-- It joins the Live PostgreSQL data with the Static Supplementary data.

USE DATABASE JALI_ML_DB;
USE SCHEMA ANALYTICS;

-- 1. Unified Table for TB Adherence ML
CREATE OR REPLACE VIEW ANALYTICS.UNIFIED_TB_ADHERENCE AS
SELECT 
    -- From Postgres (Live)
    pg.CASE_ID,
    pg.PATIENT_NAME,
    pg.CREATED_AT as SYNCED_AT,
    
    -- From Snowflake (Supplementary CRT Data)
    crt.GENDER,
    crt.AGECAT_CALC,
    crt.DISTTBCL_CALC as DISTANCE_TO_CLINIC,
    crt.TOTALMISSED_PC as MISSED_DOSE_PERCENTAGE,
    crt.MONITORPROBLEM as HAS_DEVICE_ISSUE,
    
    -- Target for Model
    crt.OUTCOME_POOR as IS_HIGH_RISK
FROM RAW.POSTGRES_OVC_CASES pg
JOIN RAW.CRT_DATASET crt ON pg.STUDY_NUMBER = crt.STUDYNUMBER;

-- 2. Unified Table for HIV Adherence
CREATE OR REPLACE VIEW ANALYTICS.UNIFIED_HIV_ADHERENCE AS
SELECT 
    pg.CASE_ID,
    hiv.UKVSUSA,
    hiv.AGE_YEARS,
    hiv.PHQ_TOTAL_AF as DEPRESSION_SCORE,
    qoc.VIRALLOAD as VIRAL_LOAD_STATUS
FROM RAW.POSTGRES_OVC_CASES pg
JOIN RAW.HIV_ADHERENCE_DATASET hiv ON pg.PATIENT_ID = hiv.INCLUDED_CASES
LEFT JOIN RAW.QUALITYOFCARE qoc ON pg.PATIENT_ID = qoc.FACILITYTYPE; -- Placeholder join

-- Verification
SELECT 'UNIFIED_TB_VIEW' as VIEW_NAME, COUNT(*) FROM ANALYTICS.UNIFIED_TB_ADHERENCE;
