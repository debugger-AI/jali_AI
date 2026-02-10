-- =====================================================
-- JALI SYSTEM AUGMENTATIONS: HEALTH TRACKING MODULES
-- Immunization (KEPI), Menstrual Tracking, HIV/TB Adherence
-- =====================================================

-- 1. KENYA EXPANDED PROGRAMME ON IMMUNIZATION (KEPI) REFERENCE
CREATE TABLE kepi_vaccination_schedule (
    schedule_id SERIAL PRIMARY KEY,
    vaccine_name VARCHAR(100) NOT NULL,
    target_age_weeks INTEGER, -- Age in weeks when vaccine is due
    target_age_months INTEGER, -- Age in months when vaccine is due
    dose_number INTEGER DEFAULT 1,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed KEPI Schedule
INSERT INTO kepi_vaccination_schedule (vaccine_name, target_age_weeks, target_age_months, dose_number, description) VALUES
('BCG', 0, 0, 1, 'At birth for TB'),
('OPV', 0, 0, 0, 'At birth - Polio'),
('OPV', 6, 1, 1, '6 Weeks - Polio'),
('Pentavalent', 6, 1, 1, '6 Weeks - DPT-HepB-Hib'),
('PCV 10', 6, 1, 1, '6 Weeks - Pneumonia'),
('Rotavirus', 6, 1, 1, '6 Weeks - Diarrhea'),
('OPV', 10, 2, 2, '10 Weeks - Polio'),
('Pentavalent', 10, 2, 2, '10 Weeks - DPT-HepB-Hib'),
('PCV 10', 10, 2, 2, '10 Weeks - Pneumonia'),
('Rotavirus', 10, 2, 2, '10 Weeks - Diarrhea'),
('OPV', 14, 3, 3, '14 Weeks - Polio'),
('Pentavalent', 14, 3, 3, '14 Weeks - DPT-HepB-Hib'),
('PCV 10', 14, 3, 3, '14 Weeks - Pneumonia'),
('IPV', 14, 3, 1, '14 Weeks - Inactivated Polio'),
('Measles-Rubella', NULL, 9, 1, '9 Months - First dose'),
('Yellow Fever', NULL, 9, 1, '9 Months'),
('Typhoid Conjugate', NULL, 9, 1, '9 Months - Integrated 2025'),
('Measles-Rubella', NULL, 18, 2, '18 Months - Second dose'),
('Vitamin A', NULL, 6, 1, 'Every 6 months until 5 years'),
('HPV', NULL, 120, 1, '9-14 years for girls');


-- 2. MENSTRUAL TRACKING (Based on FedCycleData)
CREATE TABLE menstrual_tracking_logs (
    log_id SERIAL PRIMARY KEY,
    beneficiary_id INTEGER NOT NULL, -- Links to OVC or Caregiver
    beneficiary_type VARCHAR(20) CHECK (beneficiary_type IN ('OVC', 'Caregiver')),
    cycle_number INTEGER,
    start_date DATE NOT NULL,
    end_date DATE,
    cycle_length INTEGER, -- Days from start of this to start of next
    menses_length INTEGER, -- Duration of bleeding
    bleeding_intensity INTEGER, -- Scale 1-5 or similar (MeanBleedingIntensity)
    menses_score INTEGER, -- Combined score (TotalMensesScore)
    unusual_bleeding BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 3. MEDICATION ADHERENCE TRACKING (Based on ChinaCRT & Figshare)
CREATE TABLE medication_adherence_logs (
    adherence_id SERIAL PRIMARY KEY,
    ovc_id INTEGER NOT NULL REFERENCES ovc_registration(ovc_id),
    medication_type VARCHAR(50) NOT NULL, -- 'HIV-ART', 'TB-DOTS', 'PrEP', etc.
    check_date DATE DEFAULT CURRENT_DATE,
    
    -- Adherence Metrics
    pills_dispensed INTEGER,
    pills_remaining INTEGER,
    expected_remaining INTEGER,
    missed_doses_3d INTEGER, -- Missed doses in last 3 days
    missed_doses_7d INTEGER, -- Missed doses in last 7 days
    total_missed_cycle INTEGER,
    
    -- Calculated Adherence
    adherence_percentage DECIMAL(5,2), -- (Actual taken / Expected taken) * 100
    
    -- Supervision & Monitoring
    supervision_type VARCHAR(50), -- 'DOTS-Family', 'DOTS-CHV', 'Digital-Monitor', 'Self'
    monitor_problem_detected BOOLEAN DEFAULT FALSE,
    action_taken TEXT,
    
    chv_id INTEGER REFERENCES chv_users(chv_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_menstrual_beneficiary ON menstrual_tracking_logs(beneficiary_id, beneficiary_type);
CREATE INDEX idx_adherence_ovc ON medication_adherence_logs(ovc_id);
CREATE INDEX idx_adherence_type ON medication_adherence_logs(medication_type);
CREATE INDEX idx_vaccine_age ON kepi_vaccination_schedule(target_age_weeks, target_age_months);
