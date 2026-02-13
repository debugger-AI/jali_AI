-- Database Schema for Jali AI (OLTP)
-- Focus: Households as the central unit for CHW monitoring

-- 1. Organizations (CBOs)
CREATE TABLE IF NOT EXISTS cbos (
    cbo_id VARCHAR(50) PRIMARY KEY,
    cbo_name VARCHAR(255)
);

-- 2. Community Health Volunteers (CHV / CHW)
CREATE TABLE IF NOT EXISTS chvs (
    chv_id VARCHAR(50) PRIMARY KEY,
    chv_name VARCHAR(255)
);

-- 3. Facilities
CREATE TABLE IF NOT EXISTS facilities (
    facility_id VARCHAR(50) PRIMARY KEY,
    facility_name VARCHAR(255),
    mfl_code VARCHAR(50)
);

-- 4. Schools
CREATE TABLE IF NOT EXISTS schools (
    school_id VARCHAR(50) PRIMARY KEY,
    school_name VARCHAR(255),
    school_level VARCHAR(50)
);

-- 5. Households (The family unit)
CREATE TABLE IF NOT EXISTS households (
    household_id VARCHAR(50) PRIMARY KEY,
    chv_id VARCHAR(50),
    cbo_id VARCHAR(50),
    ward_id VARCHAR(50),
    ward_name VARCHAR(100),
    constituency_id VARCHAR(50),
    constituency_name VARCHAR(100),
    county_id VARCHAR(50),
    county_name VARCHAR(100),
    CONSTRAINT fk_household_chv FOREIGN KEY (chv_id) REFERENCES chvs(chv_id),
    CONSTRAINT fk_household_cbo FOREIGN KEY (cbo_id) REFERENCES cbos(cbo_id)
);

-- 6. Caregivers (Household Heads)
CREATE TABLE IF NOT EXISTS caregivers (
    caregiver_id VARCHAR(50) PRIMARY KEY,
    household_id VARCHAR(50),
    caregiver_name VARCHAR(255),
    national_id VARCHAR(50),
    phone VARCHAR(50),
    gender VARCHAR(20),
    dob DATE,
    hiv_status VARCHAR(50),
    caregiver_type VARCHAR(100),
    father_alive VARCHAR(20),
    mother_alive VARCHAR(20),
    CONSTRAINT fk_caregiver_household FOREIGN KEY (household_id) REFERENCES households(household_id)
);

-- 7. OVCs (Orphans and Vulnerable Children)
CREATE TABLE IF NOT EXISTS ovcs (
    ovc_id VARCHAR(50) PRIMARY KEY,
    household_id VARCHAR(50),
    ovc_name VARCHAR(255),
    gender VARCHAR(20),
    dob DATE,
    birth_cert_no VARCHAR(100),
    ncpwd_no VARCHAR(100),
    disability_status VARCHAR(255),
    hiv_status VARCHAR(50),
    CONSTRAINT fk_ovc_household FOREIGN KEY (household_id) REFERENCES households(household_id)
);

-- 8. OVC Events / Cases (Progress monitoring)
CREATE TABLE IF NOT EXISTS ovc_cases (
    case_id SERIAL PRIMARY KEY,
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
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_case_ovc FOREIGN KEY (ovc_id) REFERENCES ovcs(ovc_id),
    CONSTRAINT fk_case_caregiver FOREIGN KEY (caregiver_id) REFERENCES caregivers(caregiver_id),
    CONSTRAINT fk_case_chv FOREIGN KEY (chv_id) REFERENCES chvs(chv_id)
);

-- Indexes for performance
CREATE INDEX idx_households_chv ON households(chv_id);
CREATE INDEX idx_caregivers_household ON caregivers(household_id);
CREATE INDEX idx_ovcs_household ON ovcs(household_id);
CREATE INDEX idx_ovc_cases_ovc ON ovc_cases(ovc_id);
CREATE INDEX idx_ovc_cases_date ON ovc_cases(date_of_event);
