-- Создание всех таблиц

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    permissions VARCHAR(255) NOT NULL
);

CREATE TABLE user_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    role_id INTEGER,
    status_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region_id INTEGER
);

CREATE TABLE university_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE education_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE study_forms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE infrastructure_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE application_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE universities (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    ownership_type VARCHAR(255),
    city_id INTEGER,
    founded_year INTEGER,
    website VARCHAR(255),
    admin_email VARCHAR(255),
    admin_phone VARCHAR(255),
    accreditation_number VARCHAR(255),
    accreditation_expiry_date DATE,
    status_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE faculties (
    id SERIAL PRIMARY KEY,
    university_id INTEGER,
    full_name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(255),
    dean_name VARCHAR(255),
    dean_contacts VARCHAR(255),
    address VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE specializations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    direction VARCHAR(255) NOT NULL,
    education_level_id INTEGER
);

CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER,
    specialization_id INTEGER,
    teaching_language VARCHAR(255),
    program_description TEXT,
    study_form_id INTEGER,
    duration VARCHAR(255),
    mobility_option BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE admission_conditions (
    id SERIAL PRIMARY KEY,
    program_id INTEGER,
    admission_fee NUMERIC,
    year INTEGER NOT NULL,
    passing_score NUMERIC,
    has_dvi BOOLEAN,
    budget_places INTEGER,
    targeted_places INTEGER,
    paid_places INTEGER
);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE subject_min_scores (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    min_score INTEGER NOT NULL
);

CREATE TABLE program_subjects (
    id SERIAL PRIMARY KEY,
    admission_condition_id INTEGER,
    subject_id INTEGER,
    exam_number INTEGER NOT NULL,
    min_score NUMERIC
);

CREATE TABLE disciplines (
    id SERIAL PRIMARY KEY,
    program_id INTEGER,
    name VARCHAR(255) NOT NULL,
    semester INTEGER NOT NULL,
    total_hours INTEGER NOT NULL
);

CREATE TABLE editor_invitations (
    id SERIAL PRIMARY KEY,
    university_id INTEGER,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    status VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE favorite_programs (
    user_id INTEGER NOT NULL,
    program_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, program_id)
);

CREATE TABLE favorite_universities (
    user_id INTEGER NOT NULL,
    university_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, university_id)
);

CREATE TABLE infrastructure (
    id SERIAL PRIMARY KEY,
    type_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255)
);

CREATE TABLE university_infrastructure (
    university_id INTEGER NOT NULL,
    infrastructure_id INTEGER NOT NULL,
    PRIMARY KEY (university_id, infrastructure_id)
);

CREATE TABLE university_ratings (
    id SERIAL PRIMARY KEY,
    university_id INTEGER,
    source VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    position INTEGER NOT NULL
);

CREATE TABLE university_statistics (
    id SERIAL PRIMARY KEY,
    university_id INTEGER,
    year INTEGER NOT NULL,
    student_count INTEGER,
    teacher_count INTEGER
);

CREATE TABLE university_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    full_name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(255),
    website VARCHAR(255),
    contact_person_name VARCHAR(255) NOT NULL,
    contact_person_position VARCHAR(255),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(255),
    status_id INTEGER,
    processed_by INTEGER,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE university_employees (
    university_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (university_id, user_id)
);

CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    query_text TEXT NOT NULL,
    query_time TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE specialization_subjects (
    specialization_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    is_required BOOLEAN NOT NULL,
    PRIMARY KEY (specialization_id, subject_id)
);

