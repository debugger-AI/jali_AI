-- =====================================================
-- CHW/CHV TRANSACTIONAL DATABASE SCHEMA - PostgreSQL
-- Tumikia Jamii Community Health Worker Registration System
-- =====================================================

-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS ovc_immunization_records CASCADE;
DROP TABLE IF EXISTS ovc_registration CASCADE;
DROP TABLE IF EXISTS caregivers CASCADE;
DROP TABLE IF EXISTS chv_users CASCADE;
DROP TABLE IF EXISTS health_facilities CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS cbos CASCADE;
DROP TABLE IF EXISTS wards CASCADE;
DROP TABLE IF EXISTS constituencies CASCADE;
DROP TABLE IF EXISTS counties CASCADE;

-- =====================================================
-- GEOGRAPHIC REFERENCE TABLES
-- =====================================================

-- Counties Table
CREATE TABLE counties (
    county_id SERIAL PRIMARY KEY,
    county_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constituencies Table
CREATE TABLE constituencies (
    constituency_id SERIAL PRIMARY KEY,
    constituency_name VARCHAR(100) NOT NULL,
    county_id INTEGER NOT NULL REFERENCES counties(county_id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(constituency_name, county_id)
);

-- Wards Table
CREATE TABLE wards (
    ward_id SERIAL PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL,
    constituency_id INTEGER NOT NULL REFERENCES constituencies(constituency_id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ward_name, constituency_id)
);

-- Create indexes for geographic lookups
CREATE INDEX idx_constituencies_county ON constituencies(county_id);
CREATE INDEX idx_wards_constituency ON wards(constituency_id);

-- =====================================================
-- COMMUNITY-BASED ORGANIZATIONS (CBOs)
-- =====================================================

CREATE TABLE cbos (
    cbo_id SERIAL PRIMARY KEY,
    cbo_name VARCHAR(150) NOT NULL,
    ward_id INTEGER REFERENCES wards(ward_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cbos_ward ON cbos(ward_id);

-- =====================================================
-- SCHOOLS TABLE
-- =====================================================

CREATE TABLE schools (
    school_id SERIAL PRIMARY KEY,
    school_name VARCHAR(200) NOT NULL,
    school_type VARCHAR(50), -- Primary, Secondary, etc.
    ward_id INTEGER REFERENCES wards(ward_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schools_ward ON schools(ward_id);

-- =====================================================
-- HEALTH FACILITIES TABLE
-- =====================================================

CREATE TABLE health_facilities (
    facility_id SERIAL PRIMARY KEY,
    facility_name VARCHAR(200) NOT NULL,
    facility_mfl_code VARCHAR(20) UNIQUE, -- Master Facility List code
    ward_id INTEGER REFERENCES wards(ward_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facilities_ward ON health_facilities(ward_id);
CREATE INDEX idx_facilities_mfl ON health_facilities(facility_mfl_code);

-- =====================================================
-- CHV/CHW USERS TABLE
-- =====================================================

CREATE TABLE chv_users (
    chv_id SERIAL PRIMARY KEY,
    chv_code VARCHAR(20) UNIQUE,
    chv_names VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    ward_id INTEGER REFERENCES wards(ward_id) ON DELETE SET NULL,
    cbo_id INTEGER REFERENCES cbos(cbo_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chv_ward ON chv_users(ward_id);
CREATE INDEX idx_chv_cbo ON chv_users(cbo_id);

-- =====================================================
-- CAREGIVERS TABLE
-- =====================================================

CREATE TABLE caregivers (
    caregiver_id SERIAL PRIMARY KEY,
    caregiver_names VARCHAR(150) NOT NULL,
    caregiver_dob DATE,
    caregiver_age INTEGER,
    caregiver_gender VARCHAR(10) CHECK (caregiver_gender IN ('Male', 'Female', 'Other')),
    caregiver_national_id VARCHAR(20),
    phone VARCHAR(20),
    caregiver_hiv_status VARCHAR(30) DEFAULT 'Unknown' 
        CHECK (caregiver_hiv_status IN ('Positive', 'Negative', 'Unknown', 'Declined to Disclose')),
    caregiver_type VARCHAR(50), -- Primary, Secondary, etc.
    household VARCHAR(100),
    ward_id INTEGER REFERENCES wards(ward_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_caregivers_ward ON caregivers(ward_id);
CREATE INDEX idx_caregivers_phone ON caregivers(phone);
CREATE INDEX idx_caregivers_national_id ON caregivers(caregiver_national_id);

-- =====================================================
-- OVC (Orphans and Vulnerable Children) REGISTRATION
-- Main Person Registration Table
-- =====================================================

CREATE TABLE ovc_registration (
    ovc_id SERIAL PRIMARY KEY,
    ovc_names VARCHAR(150) NOT NULL,
    
    -- Demographics
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    dob VARCHAR(50), -- Original DOB string from data
    date_of_birth DATE,
    age INTEGER, -- Can be auto-calculated
    age_at_reg INTEGER, -- Age at time of registration
    age_range VARCHAR(20), -- e.g., '0-5', '6-9', '10-14', '15-17', '18+'
    
    -- Birth Certificate
    birth_cert BOOLEAN DEFAULT FALSE,
    birth_cert_number VARCHAR(50),
    
    -- Disability
    ovc_disability VARCHAR(100),
    ncpwd_number VARCHAR(50), -- National Council for Persons with Disabilities
    
    -- HIV Status & Treatment
    ovc_hiv_status VARCHAR(30) DEFAULT 'Unknown' 
        CHECK (ovc_hiv_status IN ('Positive', 'Negative', 'Unknown', 'Exposed', 'Declined to Disclose')),
    art_status VARCHAR(50), -- ART treatment status
    facility_id INTEGER REFERENCES health_facilities(facility_id) ON DELETE SET NULL,
    date_of_linkage DATE, -- Date linked to care
    ccc_number VARCHAR(50), -- Comprehensive Care Centre number
    duration_on_art INTEGER, -- Duration in months
    viral_load VARCHAR(50),
    date_of_event DATE, -- Latest viral load test date
    suppression VARCHAR(50), -- Viral suppression status
    
    -- Location
    ward_id INTEGER NOT NULL REFERENCES wards(ward_id) ON DELETE RESTRICT,
    household VARCHAR(100),
    
    -- Organization & CHV
    cbo_id INTEGER REFERENCES cbos(cbo_id) ON DELETE SET NULL,
    chv_id INTEGER REFERENCES chv_users(chv_id) ON DELETE SET NULL,
    
    -- Caregiver
    caregiver_id INTEGER REFERENCES caregivers(caregiver_id) ON DELETE SET NULL,
    caregiver_relation VARCHAR(50), -- Mother, Father, Grandmother, etc.
    
    -- Family Status
    father_alive VARCHAR(20),
    mother_alive VARCHAR(20),
    
    -- Education
    school_level VARCHAR(50) CHECK (school_level IN (
        'Not Applicable', 'Pre-Primary', 'Lower Primary', 'Upper Primary', 
        'Junior Secondary', 'Senior Secondary', 'Tertiary', 'Not in School'
    )),
    school_id INTEGER REFERENCES schools(school_id) ON DELETE SET NULL,
    class_grade VARCHAR(30),
    
    -- Program Info
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_in_program INTEGER, -- Duration in months
    
    -- Immunization
    immunization VARCHAR(100),
    eligibility VARCHAR(100),
    
    -- Exit Information
    exit_status VARCHAR(50),
    exit_date DATE,
    exit_reason VARCHAR(200),
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_ovc_ward ON ovc_registration(ward_id);
CREATE INDEX idx_ovc_cbo ON ovc_registration(cbo_id);
CREATE INDEX idx_ovc_chv ON ovc_registration(chv_id);
CREATE INDEX idx_ovc_caregiver ON ovc_registration(caregiver_id);
CREATE INDEX idx_ovc_facility ON ovc_registration(facility_id);
CREATE INDEX idx_ovc_school ON ovc_registration(school_id);
CREATE INDEX idx_ovc_dob ON ovc_registration(date_of_birth);
CREATE INDEX idx_ovc_hiv_status ON ovc_registration(ovc_hiv_status);
CREATE INDEX idx_ovc_registration_date ON ovc_registration(registration_date);
CREATE INDEX idx_ovc_exit_status ON ovc_registration(exit_status);
CREATE INDEX idx_ovc_gender ON ovc_registration(gender);

-- =====================================================
-- IMMUNIZATION RECORDS TABLE
-- =====================================================

CREATE TABLE ovc_immunization_records (
    immunization_id SERIAL PRIMARY KEY,
    ovc_id INTEGER NOT NULL REFERENCES ovc_registration(ovc_id) ON DELETE CASCADE,
    vaccine_name VARCHAR(100) NOT NULL,
    dose_number INTEGER DEFAULT 1,
    date_administered DATE NOT NULL,
    administered_by VARCHAR(150),
    facility_id INTEGER REFERENCES health_facilities(facility_id) ON DELETE SET NULL,
    batch_number VARCHAR(50),
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_immunization_ovc ON ovc_immunization_records(ovc_id);
CREATE INDEX idx_immunization_vaccine ON ovc_immunization_records(vaccine_name);
CREATE INDEX idx_immunization_date ON ovc_immunization_records(date_administered);

-- =====================================================
-- FUNCTIONS FOR AUTO-CALCULATED FIELDS
-- =====================================================

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    IF birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN DATE_PART('year', AGE(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine age range
CREATE OR REPLACE FUNCTION get_age_range(age INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF age IS NULL THEN
        RETURN 'Unknown';
    ELSIF age < 1 THEN
        RETURN '0-1';
    ELSIF age <= 5 THEN
        RETURN '1-5';
    ELSIF age <= 9 THEN
        RETURN '6-9';
    ELSIF age <= 14 THEN
        RETURN '10-14';
    ELSIF age <= 17 THEN
        RETURN '15-17';
    ELSE
        RETURN '18+';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate registration code
CREATE OR REPLACE FUNCTION generate_ovc_code(ward_code VARCHAR, reg_year INTEGER)
RETURNS VARCHAR(30) AS $$
DECLARE
    sequence_num INTEGER;
    ovc_code VARCHAR(30);
BEGIN
    -- Get next sequence number for this ward and year
    SELECT COALESCE(MAX(ovc_id), 0) + 1 INTO sequence_num FROM ovc_registration;
    ovc_code := CONCAT(COALESCE(ward_code, 'XXX'), '-', reg_year, '-', LPAD(sequence_num::TEXT, 5, '0'));
    RETURN ovc_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TO AUTO-UPDATE updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_counties_modtime BEFORE UPDATE ON counties FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_constituencies_modtime BEFORE UPDATE ON constituencies FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_wards_modtime BEFORE UPDATE ON wards FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_cbos_modtime BEFORE UPDATE ON cbos FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_schools_modtime BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_facilities_modtime BEFORE UPDATE ON health_facilities FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_chv_modtime BEFORE UPDATE ON chv_users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_caregivers_modtime BEFORE UPDATE ON caregivers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_ovc_modtime BEFORE UPDATE ON ovc_registration FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_immunization_modtime BEFORE UPDATE ON ovc_immunization_records FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View: Full OVC Details with calculated age
CREATE OR REPLACE VIEW vw_ovc_full_details AS
SELECT 
    o.ovc_id,
    o.ovc_names,
    o.gender,
    o.date_of_birth,
    calculate_age(o.date_of_birth) AS current_age,
    get_age_range(calculate_age(o.date_of_birth)) AS current_age_range,
    o.age_at_reg,
    o.birth_cert,
    o.birth_cert_number,
    o.ovc_disability,
    o.ovc_hiv_status,
    o.art_status,
    f.facility_name,
    f.facility_mfl_code,
    o.ccc_number,
    o.viral_load,
    o.suppression,
    w.ward_name,
    con.constituency_name,
    c.county_name,
    cb.cbo_name,
    chv.chv_names AS registered_by,
    cg.caregiver_names,
    cg.phone AS caregiver_phone,
    cg.caregiver_hiv_status,
    o.caregiver_relation,
    o.school_level,
    s.school_name,
    o.class_grade,
    o.immunization,
    o.eligibility,
    o.registration_date,
    o.exit_status,
    o.exit_date,
    o.exit_reason,
    o.is_active
FROM ovc_registration o
LEFT JOIN wards w ON o.ward_id = w.ward_id
LEFT JOIN constituencies con ON w.constituency_id = con.constituency_id
LEFT JOIN counties c ON con.county_id = c.county_id
LEFT JOIN cbos cb ON o.cbo_id = cb.cbo_id
LEFT JOIN chv_users chv ON o.chv_id = chv.chv_id
LEFT JOIN caregivers cg ON o.caregiver_id = cg.caregiver_id
LEFT JOIN health_facilities f ON o.facility_id = f.facility_id
LEFT JOIN schools s ON o.school_id = s.school_id;

-- View: Children with Caregivers
CREATE OR REPLACE VIEW vw_children_with_caregivers AS
SELECT 
    o.ovc_id,
    o.ovc_names AS child_name,
    o.gender,
    o.date_of_birth,
    calculate_age(o.date_of_birth) AS age,
    o.ovc_hiv_status AS child_hiv_status,
    cg.caregiver_names,
    cg.phone AS caregiver_phone,
    cg.caregiver_hiv_status,
    o.caregiver_relation,
    o.school_level,
    s.school_name,
    o.class_grade,
    w.ward_name,
    con.constituency_name,
    c.county_name
FROM ovc_registration o
LEFT JOIN caregivers cg ON o.caregiver_id = cg.caregiver_id
LEFT JOIN schools s ON o.school_id = s.school_id
LEFT JOIN wards w ON o.ward_id = w.ward_id
LEFT JOIN constituencies con ON w.constituency_id = con.constituency_id
LEFT JOIN counties c ON con.county_id = c.county_id
WHERE o.is_active = TRUE 
AND calculate_age(o.date_of_birth) < 18;

-- View: HIV Positive OVCs on Treatment
CREATE OR REPLACE VIEW vw_hiv_positive_on_art AS
SELECT 
    o.ovc_id,
    o.ovc_names,
    o.gender,
    calculate_age(o.date_of_birth) AS age,
    o.ovc_hiv_status,
    o.art_status,
    f.facility_name,
    o.ccc_number,
    o.date_of_linkage,
    o.duration_on_art,
    o.viral_load,
    o.suppression,
    w.ward_name,
    cg.caregiver_names,
    cg.caregiver_hiv_status
FROM ovc_registration o
LEFT JOIN health_facilities f ON o.facility_id = f.facility_id
LEFT JOIN wards w ON o.ward_id = w.ward_id
LEFT JOIN caregivers cg ON o.caregiver_id = cg.caregiver_id
WHERE o.ovc_hiv_status = 'Positive'
AND o.is_active = TRUE;

-- View: Summary Statistics by Ward
CREATE OR REPLACE VIEW vw_ward_statistics AS
SELECT 
    w.ward_id,
    w.ward_name,
    con.constituency_name,
    c.county_name,
    COUNT(o.ovc_id) AS total_ovcs,
    COUNT(CASE WHEN o.gender = 'Male' THEN 1 END) AS male_count,
    COUNT(CASE WHEN o.gender = 'Female' THEN 1 END) AS female_count,
    COUNT(CASE WHEN calculate_age(o.date_of_birth) < 18 THEN 1 END) AS children_count,
    COUNT(CASE WHEN o.ovc_hiv_status = 'Positive' THEN 1 END) AS hiv_positive_count,
    COUNT(CASE WHEN o.school_level IS NOT NULL AND o.school_level != 'Not in School' THEN 1 END) AS in_school_count,
    COUNT(CASE WHEN o.is_active = TRUE THEN 1 END) AS active_count
FROM wards w
LEFT JOIN constituencies con ON w.constituency_id = con.constituency_id
LEFT JOIN counties c ON con.county_id = c.county_id
LEFT JOIN ovc_registration o ON w.ward_id = o.ward_id
GROUP BY w.ward_id, w.ward_name, con.constituency_name, c.county_name;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure to register a new OVC
CREATE OR REPLACE PROCEDURE sp_register_ovc(
    p_ovc_names VARCHAR(150),
    p_gender VARCHAR(10),
    p_date_of_birth DATE,
    p_birth_cert BOOLEAN,
    p_birth_cert_number VARCHAR(50),
    p_ovc_hiv_status VARCHAR(30),
    p_ward_id INTEGER,
    p_cbo_id INTEGER,
    p_chv_id INTEGER,
    p_caregiver_id INTEGER,
    p_caregiver_relation VARCHAR(50),
    p_school_level VARCHAR(50),
    p_school_id INTEGER,
    p_class_grade VARCHAR(30),
    p_immunization VARCHAR(100),
    p_eligibility VARCHAR(100),
    OUT p_new_ovc_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_age INTEGER;
    v_age_range VARCHAR(20);
BEGIN
    -- Calculate age
    v_age := calculate_age(p_date_of_birth);
    v_age_range := get_age_range(v_age);
    
    -- Insert the OVC record
    INSERT INTO ovc_registration (
        ovc_names, gender, date_of_birth, age, age_at_reg, age_range,
        birth_cert, birth_cert_number, ovc_hiv_status,
        ward_id, cbo_id, chv_id,
        caregiver_id, caregiver_relation,
        school_level, school_id, class_grade,
        immunization, eligibility,
        registration_date
    ) VALUES (
        p_ovc_names, p_gender, p_date_of_birth, v_age, v_age, v_age_range,
        p_birth_cert, p_birth_cert_number, p_ovc_hiv_status,
        p_ward_id, p_cbo_id, p_chv_id,
        p_caregiver_id, p_caregiver_relation,
        p_school_level, p_school_id, p_class_grade,
        p_immunization, p_eligibility,
        CURRENT_DATE
    )
    RETURNING ovc_id INTO p_new_ovc_id;
END;
$$;

-- Procedure to add or update caregiver
CREATE OR REPLACE PROCEDURE sp_upsert_caregiver(
    p_caregiver_names VARCHAR(150),
    p_caregiver_dob DATE,
    p_caregiver_gender VARCHAR(10),
    p_caregiver_national_id VARCHAR(20),
    p_phone VARCHAR(20),
    p_caregiver_hiv_status VARCHAR(30),
    p_caregiver_type VARCHAR(50),
    p_ward_id INTEGER,
    OUT p_caregiver_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if caregiver exists by national ID or phone
    SELECT caregiver_id INTO p_caregiver_id
    FROM caregivers
    WHERE (caregiver_national_id = p_caregiver_national_id AND p_caregiver_national_id IS NOT NULL)
       OR (phone = p_phone AND p_phone IS NOT NULL)
    LIMIT 1;
    
    IF p_caregiver_id IS NULL THEN
        -- Insert new caregiver
        INSERT INTO caregivers (
            caregiver_names, caregiver_dob, 
            caregiver_age, caregiver_gender,
            caregiver_national_id, phone,
            caregiver_hiv_status, caregiver_type, ward_id
        ) VALUES (
            p_caregiver_names, p_caregiver_dob,
            calculate_age(p_caregiver_dob), p_caregiver_gender,
            p_caregiver_national_id, p_phone,
            p_caregiver_hiv_status, p_caregiver_type, p_ward_id
        )
        RETURNING caregiver_id INTO p_caregiver_id;
    ELSE
        -- Update existing caregiver
        UPDATE caregivers SET
            caregiver_names = COALESCE(p_caregiver_names, caregiver_names),
            caregiver_dob = COALESCE(p_caregiver_dob, caregiver_dob),
            caregiver_age = calculate_age(COALESCE(p_caregiver_dob, caregiver_dob)),
            caregiver_hiv_status = COALESCE(p_caregiver_hiv_status, caregiver_hiv_status),
            updated_at = CURRENT_TIMESTAMP
        WHERE caregiver_id = p_caregiver_id;
    END IF;
END;
$$;

COMMIT;
