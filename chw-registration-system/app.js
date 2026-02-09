/* =====================================================
   CHW REGISTRATION SYSTEM - APPLICATION LOGIC
   Updated to match Tumikia Data structure
   ===================================================== */

// Sample Data Store (simulating database - will be replaced with API calls)
const dataStore = {
    counties: [],
    constituencies: [],
    wards: [],
    cbos: [],
    schools: [],
    facilities: [],
    caregivers: [],
    chvUsers: [],
    ovcRegistrations: []
};

// Current state
let currentStep = 1;
const totalSteps = 3;
let isChildRegistration = false;
let registrationCounter = 1;
let caregiverCounter = 1;

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadSampleData();
    initializeNavigation();
    initializeForm();
    updateDashboard();
    renderRegistrationForm();
    renderRecordsTable();
    renderCaregiversTable();
});

async function loadSampleData() {
    // Sample counties from county_data.json structure
    dataStore.counties = [
        { county_id: 1, county_name: 'Mombasa' },
        { county_id: 2, county_name: 'Kwale' },
        { county_id: 3, county_name: 'Kilifi' },
        { county_id: 4, county_name: 'Tana River' },
        { county_id: 5, county_name: 'Lamu' },
        { county_id: 6, county_name: 'Taita Taveta' },
        { county_id: 7, county_name: 'Garissa' },
        { county_id: 8, county_name: 'Wajir' },
        { county_id: 9, county_name: 'Mandera' },
        { county_id: 10, county_name: 'Marsabit' },
        { county_id: 11, county_name: 'Isiolo' },
        { county_id: 12, county_name: 'Meru' },
        { county_id: 13, county_name: 'Tharaka-Nithi' },
        { county_id: 14, county_name: 'Embu' },
        { county_id: 15, county_name: 'Kitui' },
        { county_id: 16, county_name: 'Machakos' },
        { county_id: 17, county_name: 'Makueni' },
        { county_id: 18, county_name: 'Nyandarua' },
        { county_id: 19, county_name: 'Nyeri' },
        { county_id: 20, county_name: 'Kirinyaga' },
        { county_id: 21, county_name: "Murang'a" },
        { county_id: 22, county_name: 'Kiambu' },
        { county_id: 23, county_name: 'Turkana' },
        { county_id: 24, county_name: 'West Pokot' },
        { county_id: 25, county_name: 'Samburu' },
        { county_id: 26, county_name: 'Trans Nzoia' },
        { county_id: 27, county_name: 'Uasin Gishu' },
        { county_id: 28, county_name: 'Elgeyo-Marakwet' },
        { county_id: 29, county_name: 'Nandi' },
        { county_id: 30, county_name: 'Baringo' },
        { county_id: 31, county_name: 'Laikipia' },
        { county_id: 32, county_name: 'Nakuru' },
        { county_id: 33, county_name: 'Narok' },
        { county_id: 34, county_name: 'Kajiado' },
        { county_id: 35, county_name: 'Kericho' },
        { county_id: 36, county_name: 'Bomet' },
        { county_id: 37, county_name: 'Kakamega' },
        { county_id: 38, county_name: 'Vihiga' },
        { county_id: 39, county_name: 'Bungoma' },
        { county_id: 40, county_name: 'Busia' },
        { county_id: 41, county_name: 'Siaya' },
        { county_id: 42, county_name: 'Kisumu' },
        { county_id: 43, county_name: 'Homa Bay' },
        { county_id: 44, county_name: 'Migori' },
        { county_id: 45, county_name: 'Kisii' },
        { county_id: 46, county_name: 'Nyamira' },
        { county_id: 47, county_name: 'Nairobi' }
    ];

    // Sample constituencies (Mombasa example)
    dataStore.constituencies = [
        { constituency_id: 1, constituency_name: 'Changamwe', county_id: 1 },
        { constituency_id: 2, constituency_name: 'Jomvu', county_id: 1 },
        { constituency_id: 3, constituency_name: 'Kisauni', county_id: 1 },
        { constituency_id: 4, constituency_name: 'Nyali', county_id: 1 },
        { constituency_id: 5, constituency_name: 'Likoni', county_id: 1 },
        { constituency_id: 6, constituency_name: 'Mvita', county_id: 1 },
        { constituency_id: 7, constituency_name: 'Msambweni', county_id: 2 },
        { constituency_id: 8, constituency_name: 'Westlands', county_id: 47 },
        { constituency_id: 9, constituency_name: 'Dagoretti North', county_id: 47 },
        { constituency_id: 10, constituency_name: 'Langata', county_id: 47 }
    ];

    // Sample wards
    dataStore.wards = [
        { ward_id: 1, ward_name: 'Port Reitz', constituency_id: 1 },
        { ward_id: 2, ward_name: 'Kipevu', constituency_id: 1 },
        { ward_id: 3, ward_name: 'Airport', constituency_id: 1 },
        { ward_id: 4, ward_name: 'Changamwe', constituency_id: 1 },
        { ward_id: 5, ward_name: 'Chaani', constituency_id: 1 },
        { ward_id: 6, ward_name: 'Jomvu Kuu', constituency_id: 2 },
        { ward_id: 7, ward_name: 'Miritini', constituency_id: 2 },
        { ward_id: 8, ward_name: 'Mikindani', constituency_id: 2 },
        { ward_id: 9, ward_name: 'Mjambere', constituency_id: 3 },
        { ward_id: 10, ward_name: 'Junda', constituency_id: 3 }
    ];

    // Sample CBOs
    dataStore.cbos = [
        { cbo_id: 1, cbo_name: 'BEACON OF HOPE', ward_id: 1 },
        { cbo_id: 2, cbo_name: 'COMMUNITY HEALTH INITIATIVE', ward_id: 2 },
        { cbo_id: 3, cbo_name: 'TUMIKIA JAMII CBO', ward_id: 3 }
    ];

    // Sample schools
    dataStore.schools = [
        { school_id: 1, school_name: 'Port Reitz Primary School', ward_id: 1 },
        { school_id: 2, school_name: 'Changamwe Primary School', ward_id: 4 },
        { school_id: 3, school_name: 'Jomvu Kuu Primary School', ward_id: 6 },
        { school_id: 4, school_name: 'Mikindani Primary School', ward_id: 8 }
    ];

    // Sample health facilities
    dataStore.facilities = [
        { facility_id: 1, facility_name: 'Port Reitz Sub-County Hospital', facility_mfl_code: '12345', ward_id: 1 },
        { facility_id: 2, facility_name: 'Changamwe Health Centre', facility_mfl_code: '12346', ward_id: 4 },
        { facility_id: 3, facility_name: 'Jomvu Health Centre', facility_mfl_code: '12347', ward_id: 6 }
    ];

    // Sample CHV users
    dataStore.chvUsers = [
        { chv_id: 1, chv_names: 'Jane Mwangi', ward_id: 1, cbo_id: 1 },
        { chv_id: 2, chv_names: 'John Ochieng', ward_id: 4, cbo_id: 2 }
    ];

    // Sample caregivers
    dataStore.caregivers = [
        { caregiver_id: 1, caregiver_names: 'Mary Wanjiku', phone: '0712345678', caregiver_hiv_status: 'Negative', caregiver_relation: 'Mother', ward_id: 1 },
        { caregiver_id: 2, caregiver_names: 'Sarah Akinyi', phone: '0723456789', caregiver_hiv_status: 'Positive', caregiver_relation: 'Grandmother', ward_id: 4 }
    ];
    caregiverCounter = 3;

    // Sample OVC registrations
    dataStore.ovcRegistrations = [
        { ovc_id: 1, ovc_names: 'John Kamau', gender: 'Male', date_of_birth: '2015-05-10', ovc_hiv_status: 'Negative', ward_id: 1, caregiver_id: 1, school_level: 'Lower Primary', registration_date: '2026-01-15' },
        { ovc_id: 2, ovc_names: 'Grace Achieng', gender: 'Female', date_of_birth: '2018-08-22', ovc_hiv_status: 'Exposed', ward_id: 4, caregiver_id: 2, school_level: 'Pre-Primary', registration_date: '2026-01-20' },
        { ovc_id: 3, ovc_names: 'Peter Mwamba', gender: 'Male', date_of_birth: '2012-03-15', ovc_hiv_status: 'Positive', art_status: 'On ART', facility_id: 1, ward_id: 1, caregiver_id: 1, school_level: 'Upper Primary', registration_date: '2026-02-01' },
        { ovc_id: 4, ovc_names: 'Faith Nyambura', gender: 'Female', date_of_birth: '2020-11-05', ovc_hiv_status: 'Unknown', ward_id: 6, caregiver_id: null, school_level: 'Pre-Primary', registration_date: '2026-02-05' },
        { ovc_id: 5, ovc_names: 'James Omondi', gender: 'Male', date_of_birth: '2010-07-20', ovc_hiv_status: 'Negative', ward_id: 8, caregiver_id: 2, school_level: 'Junior Secondary', registration_date: '2026-02-06' }
    ];
    registrationCounter = 6;
}

// =====================================================
// NAVIGATION
// =====================================================
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            sidebar.classList.remove('open');
        });
    });

    mobileMenuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

function showSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
        document.getElementById('pageTitle').textContent = formatTitle(sectionName);
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.toggle('active', nav.dataset.section === sectionName);
        });
    }
}

function formatTitle(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

// =====================================================
// FORM INITIALIZATION
// =====================================================
function initializeForm() {
    const countySelect = document.getElementById('county');
    const constituencySelect = document.getElementById('constituency');
    const wardSelect = document.getElementById('ward');
    const dobInput = document.getElementById('dateOfBirth');
    const attendsSchoolCheckbox = document.getElementById('attendsSchool');
    const hasBirthCertCheckbox = document.getElementById('hasBirthCertificate');
    const caregiverSelect = document.getElementById('caregiverSelect');
    const relationshipSelect = document.getElementById('relationshipToCaregiver');

    countySelect?.addEventListener('change', handleCountyChange);
    constituencySelect?.addEventListener('change', handleConstituencyChange);

    if (dobInput) {
        dobInput.addEventListener('change', handleDateOfBirthChange);
        dobInput.max = new Date().toISOString().split('T')[0];
    }

    attendsSchoolCheckbox?.addEventListener('change', (e) => {
        const schoolSection = document.getElementById('schoolSection');
        if (schoolSection) schoolSection.style.display = e.target.checked ? 'block' : 'none';
    });

    hasBirthCertCheckbox?.addEventListener('change', (e) => {
        const certInput = document.getElementById('birthCertificateNumber');
        if (certInput) certInput.disabled = !e.target.checked;
    });

    caregiverSelect?.addEventListener('change', handleCaregiverSelectChange);

    relationshipSelect?.addEventListener('change', (e) => {
        const otherGroup = document.getElementById('otherRelationshipGroup');
        if (otherGroup) otherGroup.style.display = e.target.value === 'Other' ? 'block' : 'none';
    });
}

function handleCountyChange(e) {
    const countyId = parseInt(e.target.value);
    const constituencySelect = document.getElementById('constituency');
    const wardSelect = document.getElementById('ward');

    constituencySelect.innerHTML = '<option value="">Select Constituency</option>';
    wardSelect.innerHTML = '<option value="">Select Ward</option>';
    wardSelect.disabled = true;

    if (countyId) {
        constituencySelect.disabled = false;
        const constituencies = dataStore.constituencies.filter(c => c.county_id === countyId);
        constituencies.forEach(c => {
            constituencySelect.innerHTML += `<option value="${c.constituency_id}">${c.constituency_name}</option>`;
        });
    } else {
        constituencySelect.disabled = true;
    }
}

function handleConstituencyChange(e) {
    const constituencyId = parseInt(e.target.value);
    const wardSelect = document.getElementById('ward');

    wardSelect.innerHTML = '<option value="">Select Ward</option>';

    if (constituencyId) {
        wardSelect.disabled = false;
        const wards = dataStore.wards.filter(w => w.constituency_id === constituencyId);
        wards.forEach(w => {
            wardSelect.innerHTML += `<option value="${w.ward_id}">${w.ward_name}</option>`;
        });
    } else {
        wardSelect.disabled = true;
    }
}

function handleDateOfBirthChange(e) {
    const dob = new Date(e.target.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    const ageInput = document.getElementById('calculatedAge');
    if (ageInput) {
        ageInput.value = age >= 0 ? `${age} years` : '';
    }

    // Determine age range
    const ageRangeInput = document.getElementById('ageRange');
    if (ageRangeInput) {
        ageRangeInput.value = getAgeRange(age);
    }

    isChildRegistration = age < 18 && age >= 0;
    const childSection = document.getElementById('childSection');
    if (childSection) {
        childSection.style.display = isChildRegistration ? 'block' : 'none';
    }

    updateFormSteps();
}

function getAgeRange(age) {
    if (age < 0) return 'Unknown';
    if (age < 1) return '0-1';
    if (age <= 5) return '1-5';
    if (age <= 9) return '6-9';
    if (age <= 14) return '10-14';
    if (age <= 17) return '15-17';
    return '18+';
}

function handleCaregiverSelectChange(e) {
    const newCaregiverForm = document.getElementById('newCaregiverForm');
    if (newCaregiverForm) {
        newCaregiverForm.style.display = e.target.value === '' ? 'block' : 'none';
    }
}

// =====================================================
// RENDER REGISTRATION FORM
// =====================================================
function renderRegistrationForm() {
    const registerSection = document.getElementById('registerSection');
    if (!registerSection) return;

    registerSection.innerHTML = `
        <div class="card registration-form-card">
            <div class="card-header">
                <h2>Register New OVC</h2>
                <span class="step-indicator">Step <span id="currentStepDisplay">1</span> of <span id="totalStepsDisplay">3</span></span>
            </div>
            <div class="card-body">
                <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width: 33.33%"></div></div>
                <form id="registrationForm" class="registration-form">
                    ${renderStep1()}
                    ${renderStep2()}
                    ${renderStep3()}
                    <div class="form-navigation">
                        <button type="button" class="btn btn-outline" id="prevBtn" style="display: none;">Previous</button>
                        <button type="button" class="btn btn-primary" id="nextBtn">Next</button>
                        <button type="submit" class="btn btn-success" id="submitBtn" style="display: none;">Register OVC</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    populateCountyDropdown();
    populateSchoolDropdown();
    populateFacilityDropdown();
    populateCboDropdown();
    populateCaregiverDropdown();
    initializeForm();
    initializeFormNavigation();
}

function renderStep1() {
    return `
        <div class="form-step active" id="formStep1">
            <h3 class="step-title">Location & Basic Information</h3>
            <div class="form-row">
                <div class="form-group"><label for="county">County <span class="required">*</span></label><select id="county" name="county" required><option value="">Select County</option></select></div>
                <div class="form-group"><label for="constituency">Constituency <span class="required">*</span></label><select id="constituency" name="constituency" required disabled><option value="">Select Constituency</option></select></div>
                <div class="form-group"><label for="ward">Ward <span class="required">*</span></label><select id="ward" name="ward" required disabled><option value="">Select Ward</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="cboId">CBO</label><select id="cboId" name="cboId"><option value="">Select CBO</option></select></div>
            </div>
            <div class="form-divider"></div>
            <div class="form-row">
                <div class="form-group"><label for="ovcNames">Full Name <span class="required">*</span></label><input type="text" id="ovcNames" name="ovcNames" required placeholder="Enter full name"></div>
                <div class="form-group"><label for="gender">Gender <span class="required">*</span></label><select id="gender" name="gender" required><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="dateOfBirth">Date of Birth <span class="required">*</span></label><input type="date" id="dateOfBirth" name="dateOfBirth" required></div>
                <div class="form-group"><label for="calculatedAge">Age</label><input type="text" id="calculatedAge" readonly placeholder="Auto-calculated"></div>
                <div class="form-group"><label for="ageRange">Age Range</label><input type="text" id="ageRange" readonly placeholder="Auto-calculated"></div>
            </div>
            <div class="form-divider"></div>
            <div class="form-row">
                <div class="form-group"><label class="toggle-label"><input type="checkbox" id="birthCert" name="birthCert"><span class="toggle-switch"></span><span>Has Birth Certificate</span></label></div>
                <div class="form-group"><label for="birthCertNumber">Birth Certificate Number</label><input type="text" id="birthCertNumber" name="birthCertNumber" placeholder="Certificate number" disabled></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label for="ovcDisability">Disability</label><input type="text" id="ovcDisability" name="ovcDisability" placeholder="Specify disability if any"></div>
                <div class="form-group"><label for="ncpwdNumber">NCPWD Number</label><input type="text" id="ncpwdNumber" name="ncpwdNumber" placeholder="NCPWD registration number"></div>
            </div>
        </div>
    `;
}

function renderStep2() {
    return `
        <div class="form-step" id="formStep2">
            <h3 class="step-title">Health & Education Information</h3>
            <div class="form-row">
                <div class="form-group"><label for="ovcHivStatus">HIV Status <span class="required">*</span></label><select id="ovcHivStatus" name="ovcHivStatus" required><option value="Unknown">Unknown</option><option value="Positive">Positive</option><option value="Negative">Negative</option><option value="Exposed">Exposed (HEI)</option><option value="Declined to Disclose">Declined to Disclose</option></select></div>
            </div>
            <div class="hiv-positive-section" id="hivPositiveSection" style="display: none;">
                <h4 class="section-subtitle">ART & Treatment Information</h4>
                <div class="form-row">
                    <div class="form-group"><label for="artStatus">ART Status</label><select id="artStatus" name="artStatus"><option value="">Select Status</option><option value="On ART">On ART</option><option value="Not on ART">Not on ART</option><option value="Defaulted">Defaulted</option></select></div>
                    <div class="form-group"><label for="facilityId">Health Facility</label><select id="facilityId" name="facilityId"><option value="">Select Facility</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="dateOfLinkage">Date of Linkage</label><input type="date" id="dateOfLinkage" name="dateOfLinkage"></div>
                    <div class="form-group"><label for="cccNumber">CCC Number</label><input type="text" id="cccNumber" name="cccNumber" placeholder="Comprehensive Care Centre No."></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="viralLoad">Viral Load</label><input type="text" id="viralLoad" name="viralLoad" placeholder="Latest viral load"></div>
                    <div class="form-group"><label for="suppression">Suppression Status</label><select id="suppression" name="suppression"><option value="">Select</option><option value="Suppressed">Suppressed</option><option value="Not Suppressed">Not Suppressed</option><option value="Unknown">Unknown</option></select></div>
                </div>
            </div>
            <div class="form-divider"></div>
            <h4 class="section-subtitle">Family Status</h4>
            <div class="form-row">
                <div class="form-group"><label for="fatherAlive">Father Alive?</label><select id="fatherAlive" name="fatherAlive"><option value="">Unknown</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                <div class="form-group"><label for="motherAlive">Mother Alive?</label><select id="motherAlive" name="motherAlive"><option value="">Unknown</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
            </div>
            <div class="form-divider"></div>
            <h4 class="section-subtitle">Education</h4>
            <div class="form-row">
                <div class="form-group"><label for="schoolLevel">School Level</label><select id="schoolLevel" name="schoolLevel"><option value="Not Applicable">Not Applicable</option><option value="Pre-Primary">Pre-Primary (ECD)</option><option value="Lower Primary">Lower Primary (Class 1-3)</option><option value="Upper Primary">Upper Primary (Class 4-6)</option><option value="Junior Secondary">Junior Secondary (Grade 7-9)</option><option value="Senior Secondary">Senior Secondary (Grade 10-12)</option><option value="Tertiary">Tertiary</option><option value="Not in School">Not in School</option></select></div>
                <div class="form-group"><label for="schoolId">School</label><select id="schoolId" name="schoolId"><option value="">Select School</option></select></div>
                <div class="form-group"><label for="classGrade">Class/Grade</label><input type="text" id="classGrade" name="classGrade" placeholder="e.g., Class 4, Grade 8"></div>
            </div>
            <div class="form-divider"></div>
            <h4 class="section-subtitle">Immunization</h4>
            <div class="form-row">
                <div class="form-group"><label for="immunization">Immunization Status</label><input type="text" id="immunization" name="immunization" placeholder="e.g., Fully Immunized, Pending"></div>
                <div class="form-group"><label for="eligibility">Eligibility Notes</label><input type="text" id="eligibility" name="eligibility" placeholder="Eligibility criteria"></div>
            </div>
        </div>
    `;
}

function renderStep3() {
    return `
        <div class="form-step" id="formStep3">
            <h3 class="step-title">Caregiver Information</h3>
            <div class="caregiver-section" id="caregiverSection">
                <div class="form-row"><div class="form-group full-width"><label for="caregiverSelect">Select Existing Caregiver or Add New</label><select id="caregiverSelect" name="caregiverSelect"><option value="">-- Add New Caregiver --</option></select></div></div>
                <div class="new-caregiver-form" id="newCaregiverForm">
                    <h4 class="section-subtitle">New Caregiver Details</h4>
                    <div class="form-row">
                        <div class="form-group"><label for="caregiverNames">Full Name <span class="required">*</span></label><input type="text" id="caregiverNames" name="caregiverNames" placeholder="Caregiver full name"></div>
                        <div class="form-group"><label for="caregiverGender">Gender</label><select id="caregiverGender" name="caregiverGender"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label for="caregiverNationalId">National ID</label><input type="text" id="caregiverNationalId" name="caregiverNationalId" placeholder="National ID number"></div>
                        <div class="form-group"><label for="caregiverPhone">Phone Number <span class="required">*</span></label><input type="tel" id="caregiverPhone" name="caregiverPhone" placeholder="0712345678"></div>
                        <div class="form-group"><label for="caregiverHivStatus">HIV Status</label><select id="caregiverHivStatus" name="caregiverHivStatus"><option value="Unknown">Unknown</option><option value="Positive">Positive</option><option value="Negative">Negative</option><option value="Declined to Disclose">Declined to Disclose</option></select></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label for="caregiverType">Caregiver Type</label><select id="caregiverType" name="caregiverType"><option value="">Select</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option></select></div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="caregiverRelation">Relationship to OVC <span class="required">*</span></label><select id="caregiverRelation" name="caregiverRelation"><option value="">Select Relationship</option><option value="Mother">Mother</option><option value="Father">Father</option><option value="Grandmother">Grandmother</option><option value="Grandfather">Grandfather</option><option value="Aunt">Aunt</option><option value="Uncle">Uncle</option><option value="Sibling">Sibling</option><option value="Guardian">Guardian</option><option value="Foster Parent">Foster Parent</option><option value="Other">Other</option></select></div>
                    <div class="form-group" id="otherRelationshipGroup" style="display: none;"><label for="otherRelationship">Specify</label><input type="text" id="otherRelationship" name="otherRelationship" placeholder="Specify relationship"></div>
                </div>
            </div>
            <div class="adult-message" id="adultMessage" style="display: none;"><div class="info-box"><p>This person is registered as an adult (18+). Caregiver information is optional but recommended.</p></div></div>
        </div>
    `;
}

// Populate dropdowns
function populateCountyDropdown() {
    const countySelect = document.getElementById('county');
    if (!countySelect) return;
    countySelect.innerHTML = '<option value="">Select County</option>';
    dataStore.counties.forEach(c => {
        countySelect.innerHTML += `<option value="${c.county_id}">${c.county_name}</option>`;
    });
}

function populateSchoolDropdown() {
    const schoolSelect = document.getElementById('schoolId');
    if (!schoolSelect) return;
    schoolSelect.innerHTML = '<option value="">Select School</option>';
    dataStore.schools.forEach(s => {
        schoolSelect.innerHTML += `<option value="${s.school_id}">${s.school_name}</option>`;
    });
}

function populateFacilityDropdown() {
    const facilitySelect = document.getElementById('facilityId');
    if (!facilitySelect) return;
    facilitySelect.innerHTML = '<option value="">Select Facility</option>';
    dataStore.facilities.forEach(f => {
        facilitySelect.innerHTML += `<option value="${f.facility_id}">${f.facility_name}</option>`;
    });
}

function populateCboDropdown() {
    const cboSelect = document.getElementById('cboId');
    if (!cboSelect) return;
    cboSelect.innerHTML = '<option value="">Select CBO</option>';
    dataStore.cbos.forEach(c => {
        cboSelect.innerHTML += `<option value="${c.cbo_id}">${c.cbo_name}</option>`;
    });
}

function populateCaregiverDropdown() {
    const caregiverSelect = document.getElementById('caregiverSelect');
    if (!caregiverSelect) return;
    caregiverSelect.innerHTML = '<option value="">-- Add New Caregiver --</option>';
    dataStore.caregivers.forEach(c => {
        caregiverSelect.innerHTML += `<option value="${c.caregiver_id}">${c.caregiver_names} - ${c.phone || 'No phone'}</option>`;
    });
}

// =====================================================
// FORM NAVIGATION
// =====================================================
function initializeFormNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('registrationForm');

    // HIV status change handler
    const hivStatusSelect = document.getElementById('ovcHivStatus');
    hivStatusSelect?.addEventListener('change', (e) => {
        const hivSection = document.getElementById('hivPositiveSection');
        if (hivSection) {
            hivSection.style.display = e.target.value === 'Positive' ? 'block' : 'none';
        }
    });

    // Birth cert handler
    const birthCertCheck = document.getElementById('birthCert');
    birthCertCheck?.addEventListener('change', (e) => {
        const certInput = document.getElementById('birthCertNumber');
        if (certInput) certInput.disabled = !e.target.checked;
    });

    prevBtn?.addEventListener('click', () => navigateStep(-1));
    nextBtn?.addEventListener('click', () => navigateStep(1));
    form?.addEventListener('submit', handleFormSubmit);
}

function navigateStep(direction) {
    const maxSteps = 3;

    if (direction === 1 && !validateCurrentStep()) {
        return;
    }

    currentStep += direction;
    currentStep = Math.max(1, Math.min(currentStep, maxSteps));

    updateFormSteps();
}

function validateCurrentStep() {
    const currentStepElement = document.querySelector('.form-step.active');
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--error-500)';
            isValid = false;
        } else {
            field.style.borderColor = '';
        }
    });

    if (!isValid) {
        showToast('Please fill in all required fields', 'error');
    }

    return isValid;
}

function updateFormSteps() {
    const steps = document.querySelectorAll('.form-step');
    const maxSteps = 3;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressFill = document.getElementById('progressFill');
    const currentStepDisplay = document.getElementById('currentStepDisplay');
    const totalStepsDisplay = document.getElementById('totalStepsDisplay');

    steps.forEach((step, index) => {
        step.classList.toggle('active', index === currentStep - 1);
    });

    if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentStep < maxSteps ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.style.display = currentStep === maxSteps ? 'inline-flex' : 'none';

    if (progressFill) progressFill.style.width = `${(currentStep / maxSteps) * 100}%`;
    if (currentStepDisplay) currentStepDisplay.textContent = currentStep;
    if (totalStepsDisplay) totalStepsDisplay.textContent = maxSteps;
}

// =====================================================
// FORM SUBMISSION
// =====================================================
function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateCurrentStep()) {
        return;
    }

    const formData = new FormData(e.target);
    const wardId = parseInt(formData.get('ward'));
    const ward = dataStore.wards.find(w => w.ward_id === wardId);
    const dob = formData.get('dateOfBirth');
    const age = calculateAge(dob);

    // Handle caregiver
    let caregiver_id = parseInt(formData.get('caregiverSelect'));

    if (!caregiver_id && formData.get('caregiverNames')) {
        const newCaregiver = {
            caregiver_id: caregiverCounter++,
            caregiver_names: formData.get('caregiverNames'),
            caregiver_gender: formData.get('caregiverGender'),
            caregiver_national_id: formData.get('caregiverNationalId'),
            phone: formData.get('caregiverPhone'),
            caregiver_hiv_status: formData.get('caregiverHivStatus'),
            caregiver_type: formData.get('caregiverType'),
            ward_id: wardId
        };
        dataStore.caregivers.push(newCaregiver);
        caregiver_id = newCaregiver.caregiver_id;
    }

    // Create OVC record
    const ovc = {
        ovc_id: registrationCounter++,
        ovc_names: formData.get('ovcNames'),
        gender: formData.get('gender'),
        date_of_birth: dob,
        age: age,
        age_range: getAgeRange(age),
        birth_cert: formData.get('birthCert') === 'on',
        birth_cert_number: formData.get('birthCertNumber'),
        ovc_disability: formData.get('ovcDisability'),
        ncpwd_number: formData.get('ncpwdNumber'),
        ovc_hiv_status: formData.get('ovcHivStatus'),
        art_status: formData.get('artStatus'),
        facility_id: parseInt(formData.get('facilityId')) || null,
        date_of_linkage: formData.get('dateOfLinkage'),
        ccc_number: formData.get('cccNumber'),
        viral_load: formData.get('viralLoad'),
        suppression: formData.get('suppression'),
        ward_id: wardId,
        cbo_id: parseInt(formData.get('cboId')) || null,
        caregiver_id: caregiver_id || null,
        caregiver_relation: formData.get('caregiverRelation'),
        father_alive: formData.get('fatherAlive'),
        mother_alive: formData.get('motherAlive'),
        school_level: formData.get('schoolLevel'),
        school_id: parseInt(formData.get('schoolId')) || null,
        class_grade: formData.get('classGrade'),
        immunization: formData.get('immunization'),
        eligibility: formData.get('eligibility'),
        registration_date: new Date().toISOString().split('T')[0]
    };

    dataStore.ovcRegistrations.push(ovc);

    showToast(`Successfully registered ${ovc.ovc_names}`, 'success');

    e.target.reset();
    currentStep = 1;
    isChildRegistration = false;
    updateFormSteps();
    updateDashboard();
    renderRecordsTable();
    renderCaregiversTable();

    setTimeout(() => showSection('records'), 1500);
}

// =====================================================
// RECORDS TABLE
// =====================================================
function renderRecordsTable() {
    const recordsSection = document.getElementById('recordsSection');
    if (!recordsSection) return;

    recordsSection.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>OVC Registrations</h2>
                <div class="header-actions">
                    <select id="filterGender" class="filter-select" onchange="filterRecords()"><option value="">All Genders</option><option value="Male">Male</option><option value="Female">Female</option></select>
                    <select id="filterHivStatus" class="filter-select" onchange="filterRecords()"><option value="">All HIV Status</option><option value="Positive">Positive</option><option value="Negative">Negative</option><option value="Exposed">Exposed</option><option value="Unknown">Unknown</option></select>
                    <button class="btn btn-primary" onclick="showSection('register')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add New</button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table" id="recordsTable">
                        <thead><tr><th>Name</th><th>Gender</th><th>Age</th><th>HIV Status</th><th>School Level</th><th>Ward</th><th>Actions</th></tr></thead>
                        <tbody id="recordsTableBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    filterRecords();
}

function filterRecords() {
    const genderFilter = document.getElementById('filterGender')?.value || '';
    const hivFilter = document.getElementById('filterHivStatus')?.value || '';
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;

    let filtered = [...dataStore.ovcRegistrations];

    if (genderFilter) {
        filtered = filtered.filter(o => o.gender === genderFilter);
    }

    if (hivFilter) {
        filtered = filtered.filter(o => o.ovc_hiv_status === hivFilter);
    }

    tbody.innerHTML = filtered.map(ovc => {
        const ward = dataStore.wards.find(w => w.ward_id === ovc.ward_id);
        const age = ovc.age || calculateAge(ovc.date_of_birth);
        return `
            <tr>
                <td>${ovc.ovc_names}</td>
                <td><span class="badge badge-${ovc.gender?.toLowerCase()}">${ovc.gender}</span></td>
                <td>${age} yrs</td>
                <td><span class="badge badge-${getHivBadgeClass(ovc.ovc_hiv_status)}">${ovc.ovc_hiv_status}</span></td>
                <td>${ovc.school_level || 'N/A'}</td>
                <td>${ward?.ward_name || 'N/A'}</td>
                <td><button class="btn-text" onclick="viewOvcDetails(${ovc.ovc_id})">View</button></td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No records found</td></tr>';
}

function getHivBadgeClass(status) {
    switch (status) {
        case 'Positive': return 'positive';
        case 'Negative': return 'negative';
        case 'Exposed': return 'exposed';
        default: return 'unknown';
    }
}

// =====================================================
// CAREGIVERS TABLE
// =====================================================
function renderCaregiversTable() {
    const caregiversSection = document.getElementById('caregiversSection');
    if (!caregiversSection) return;

    caregiversSection.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Caregivers</h2>
                <button class="btn btn-primary" onclick="showCaregiverModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Caregiver</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="data-table" id="caregiversTable">
                        <thead><tr><th>Name</th><th>Phone</th><th>HIV Status</th><th>OVCs</th><th>Actions</th></tr></thead>
                        <tbody id="caregiversTableBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const tbody = document.getElementById('caregiversTableBody');
    tbody.innerHTML = dataStore.caregivers.map(cg => {
        const ovcCount = dataStore.ovcRegistrations.filter(o => o.caregiver_id === cg.caregiver_id).length;
        return `
            <tr>
                <td>${cg.caregiver_names}</td>
                <td>${cg.phone || 'N/A'}</td>
                <td><span class="badge badge-${getHivBadgeClass(cg.caregiver_hiv_status)}">${cg.caregiver_hiv_status}</span></td>
                <td>${ovcCount}</td>
                <td><button class="btn-text" onclick="viewCaregiverDetails(${cg.caregiver_id})">View</button></td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No caregivers found</td></tr>';
}

// =====================================================
// DASHBOARD
// =====================================================
function updateDashboard() {
    const total = dataStore.ovcRegistrations.length;
    const children = dataStore.ovcRegistrations.filter(o => calculateAge(o.date_of_birth) < 18).length;
    const caregivers = dataStore.caregivers.length;

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const thisMonthReg = dataStore.ovcRegistrations.filter(o => {
        const d = new Date(o.registration_date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    document.getElementById('totalRegistrations').textContent = total;
    document.getElementById('totalChildren').textContent = children;
    document.getElementById('totalCaregivers').textContent = caregivers;
    document.getElementById('thisMonthRegistrations').textContent = thisMonthReg;

    const recentTable = document.querySelector('#recentRegistrationsTable tbody');
    if (recentTable) {
        const recent = [...dataStore.ovcRegistrations].sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date)).slice(0, 5);
        recentTable.innerHTML = recent.map(o => `
            <tr>
                <td>${o.ovc_id}</td>
                <td>${o.ovc_names}</td>
                <td>${calculateAge(o.date_of_birth)} yrs</td>
                <td><span class="badge badge-${o.gender?.toLowerCase()}">${o.gender}</span></td>
                <td>${formatDate(o.registration_date)}</td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No registrations yet</td></tr>';
    }

    renderReportsSection();
}

function renderReportsSection() {
    const reportsSection = document.getElementById('reportsSection');
    if (!reportsSection) return;

    const total = dataStore.ovcRegistrations.length;
    const hivPositive = dataStore.ovcRegistrations.filter(o => o.ovc_hiv_status === 'Positive').length;
    const hivNegative = dataStore.ovcRegistrations.filter(o => o.ovc_hiv_status === 'Negative').length;
    const hivExposed = dataStore.ovcRegistrations.filter(o => o.ovc_hiv_status === 'Exposed').length;
    const inSchool = dataStore.ovcRegistrations.filter(o => o.school_level && o.school_level !== 'Not in School' && o.school_level !== 'Not Applicable').length;

    reportsSection.innerHTML = `
        <div class="reports-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
            <div class="card">
                <div class="card-header"><h2>Generate Reports</h2></div>
                <div class="card-body">
                    <button class="action-btn" onclick="generateReport('all')"><span>📊 Full Registration Report</span></button>
                    <button class="action-btn" onclick="generateReport('hiv')"><span>🏥 HIV Status Report</span></button>
                    <button class="action-btn" onclick="generateReport('school')"><span>🎓 Education Report</span></button>
                    <button class="action-btn" onclick="generateReport('caregivers')"><span>👨‍👩‍👧 Caregivers Report</span></button>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h2>Statistics</h2></div>
                <div class="card-body">
                    <div style="display:flex;flex-direction:column;gap:0.75rem;">
                        <div style="display:flex;justify-content:space-between;"><span>Total OVCs:</span><strong>${total}</strong></div>
                        <div style="display:flex;justify-content:space-between;"><span>HIV Positive:</span><strong style="color:var(--error-500)">${hivPositive}</strong></div>
                        <div style="display:flex;justify-content:space-between;"><span>HIV Negative:</span><strong style="color:var(--success-500)">${hivNegative}</strong></div>
                        <div style="display:flex;justify-content:space-between;"><span>HIV Exposed:</span><strong style="color:var(--warning-500)">${hivExposed}</strong></div>
                        <div style="display:flex;justify-content:space-between;"><span>In School:</span><strong>${inSchool}</strong></div>
                        <div style="display:flex;justify-content:space-between;"><span>Caregivers:</span><strong>${dataStore.caregivers.length}</strong></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =====================================================
// MODALS & VIEWS
// =====================================================
function showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function viewOvcDetails(ovcId) {
    const ovc = dataStore.ovcRegistrations.find(o => o.ovc_id === ovcId);
    if (!ovc) return;

    const ward = dataStore.wards.find(w => w.ward_id === ovc.ward_id);
    const caregiver = dataStore.caregivers.find(c => c.caregiver_id === ovc.caregiver_id);
    const facility = dataStore.facilities.find(f => f.facility_id === ovc.facility_id);
    const school = dataStore.schools.find(s => s.school_id === ovc.school_id);

    let content = `
        <div class="ovc-details">
            <h4>Basic Information</h4>
            <p><strong>Name:</strong> ${ovc.ovc_names}</p>
            <p><strong>Gender:</strong> ${ovc.gender}</p>
            <p><strong>Date of Birth:</strong> ${formatDate(ovc.date_of_birth)} (${calculateAge(ovc.date_of_birth)} years)</p>
            <p><strong>Age Range:</strong> ${ovc.age_range || getAgeRange(calculateAge(ovc.date_of_birth))}</p>
            <p><strong>Ward:</strong> ${ward?.ward_name || 'N/A'}</p>
            ${ovc.birth_cert ? `<p><strong>Birth Certificate:</strong> ${ovc.birth_cert_number || 'Yes'}</p>` : ''}
            ${ovc.ovc_disability ? `<p><strong>Disability:</strong> ${ovc.ovc_disability}</p>` : ''}
            
            <hr style="margin: 1rem 0; border-color: var(--border-color);">
            <h4>Health Information</h4>
            <p><strong>HIV Status:</strong> ${ovc.ovc_hiv_status}</p>
            ${ovc.art_status ? `<p><strong>ART Status:</strong> ${ovc.art_status}</p>` : ''}
            ${facility ? `<p><strong>Health Facility:</strong> ${facility.facility_name}</p>` : ''}
            ${ovc.ccc_number ? `<p><strong>CCC Number:</strong> ${ovc.ccc_number}</p>` : ''}
            ${ovc.viral_load ? `<p><strong>Viral Load:</strong> ${ovc.viral_load} (${ovc.suppression || 'Unknown'})</p>` : ''}
            
            <hr style="margin: 1rem 0; border-color: var(--border-color);">
            <h4>Education</h4>
            <p><strong>School Level:</strong> ${ovc.school_level || 'N/A'}</p>
            ${school ? `<p><strong>School:</strong> ${school.school_name}</p>` : ''}
            ${ovc.class_grade ? `<p><strong>Class/Grade:</strong> ${ovc.class_grade}</p>` : ''}
    `;

    if (caregiver) {
        content += `
            <hr style="margin: 1rem 0; border-color: var(--border-color);">
            <h4>Caregiver</h4>
            <p><strong>Name:</strong> ${caregiver.caregiver_names}</p>
            <p><strong>Phone:</strong> ${caregiver.phone || 'N/A'}</p>
            <p><strong>HIV Status:</strong> ${caregiver.caregiver_hiv_status}</p>
            <p><strong>Relationship:</strong> ${ovc.caregiver_relation || 'N/A'}</p>
        `;
    }

    content += `<p style="margin-top:1rem;color:var(--text-muted);font-size:0.875rem;">Registered: ${formatDate(ovc.registration_date)}</p></div>`;
    showModal('OVC Details', content);
}

function viewCaregiverDetails(caregiverId) {
    const cg = dataStore.caregivers.find(c => c.caregiver_id === caregiverId);
    if (!cg) return;

    const ovcs = dataStore.ovcRegistrations.filter(o => o.caregiver_id === caregiverId);

    let content = `
        <div class="caregiver-details">
            <p><strong>Name:</strong> ${cg.caregiver_names}</p>
            <p><strong>Phone:</strong> ${cg.phone || 'N/A'}</p>
            <p><strong>Gender:</strong> ${cg.caregiver_gender || 'N/A'}</p>
            <p><strong>National ID:</strong> ${cg.caregiver_national_id || 'N/A'}</p>
            <p><strong>HIV Status:</strong> ${cg.caregiver_hiv_status}</p>
            <hr style="margin: 1rem 0; border-color: var(--border-color);">
            <h4>OVCs under care (${ovcs.length})</h4>
            ${ovcs.map(o => `<p>• ${o.ovc_names} (${calculateAge(o.date_of_birth)} years) - ${o.caregiver_relation || 'N/A'}</p>`).join('') || '<p>No OVCs registered</p>'}
        </div>
    `;
    showModal('Caregiver Details', content);
}

function showCaregiverModal() {
    const content = `
        <form onsubmit="addNewCaregiver(event)">
            <div class="form-group"><label>Full Name *</label><input type="text" id="newCgNames" required></div>
            <div class="form-group"><label>Phone Number *</label><input type="tel" id="newCgPhone" required></div>
            <div class="form-group"><label>HIV Status</label><select id="newCgHivStatus"><option value="Unknown">Unknown</option><option value="Positive">Positive</option><option value="Negative">Negative</option></select></div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:1rem;">Add Caregiver</button>
        </form>
    `;
    showModal('Add New Caregiver', content);
}

function addNewCaregiver(e) {
    e.preventDefault();
    const newCaregiver = {
        caregiver_id: caregiverCounter++,
        caregiver_names: document.getElementById('newCgNames').value,
        phone: document.getElementById('newCgPhone').value,
        caregiver_hiv_status: document.getElementById('newCgHivStatus').value,
        ward_id: 1
    };
    dataStore.caregivers.push(newCaregiver);
    closeModal();
    renderCaregiversTable();
    updateDashboard();
    showToast('Caregiver added successfully', 'success');
}

function generateReport(type) {
    showToast(`Generating ${type} report...`, 'success');
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Event listeners
document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});
