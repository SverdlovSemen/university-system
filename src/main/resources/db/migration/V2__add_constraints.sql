-- Добавление уникальных ограничений

ALTER TABLE roles ADD CONSTRAINT roles_name_unique UNIQUE (name);
ALTER TABLE user_statuses ADD CONSTRAINT user_statuses_name_unique UNIQUE (name);
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE regions ADD CONSTRAINT regions_name_unique UNIQUE (name);
ALTER TABLE cities ADD CONSTRAINT cities_name_unique UNIQUE (name);
ALTER TABLE university_statuses ADD CONSTRAINT university_statuses_name_unique UNIQUE (name);
ALTER TABLE education_levels ADD CONSTRAINT education_levels_name_unique UNIQUE (name);
ALTER TABLE study_forms ADD CONSTRAINT study_forms_name_unique UNIQUE (name);
ALTER TABLE infrastructure_types ADD CONSTRAINT infrastructure_types_name_unique UNIQUE (name);
ALTER TABLE application_statuses ADD CONSTRAINT application_statuses_name_unique UNIQUE (name);
ALTER TABLE specializations ADD CONSTRAINT specializations_code_unique UNIQUE (code);
ALTER TABLE subjects ADD CONSTRAINT subjects_name_unique UNIQUE (name);
ALTER TABLE editor_invitations ADD CONSTRAINT editor_invitations_token_unique UNIQUE (token);

ALTER TABLE subject_min_scores ADD CONSTRAINT subject_min_scores_subject_year_unique UNIQUE (subject_id, year);
ALTER TABLE university_statistics ADD CONSTRAINT university_statistics_university_year_unique UNIQUE (university_id, year);
ALTER TABLE university_ratings ADD CONSTRAINT university_ratings_source_year_position_unique UNIQUE (source, year, position);
ALTER TABLE disciplines ADD CONSTRAINT disciplines_program_name_semester_unique UNIQUE (program_id, name, semester);
ALTER TABLE program_subjects ADD CONSTRAINT program_subjects_adm_cond_subject_unique UNIQUE (admission_condition_id, subject_id);
ALTER TABLE admission_conditions ADD CONSTRAINT admission_conditions_program_year_unique UNIQUE (program_id, year);

-- Проверочные ограничения

ALTER TABLE subject_min_scores ADD CONSTRAINT subject_min_scores_min_score_check CHECK (min_score >= 0 AND min_score <= 100);

-- Внешние ключи

ALTER TABLE users
ADD CONSTRAINT users_roles_fk
FOREIGN KEY (role_id) REFERENCES roles (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE users
ADD CONSTRAINT users_user_statuses_fk
FOREIGN KEY (status_id) REFERENCES user_statuses (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE cities
ADD CONSTRAINT cities_regions_fk
FOREIGN KEY (region_id) REFERENCES regions (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE universities
ADD CONSTRAINT universities_cities_fk
FOREIGN KEY (city_id) REFERENCES cities (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE universities
ADD CONSTRAINT universities_university_statuses_fk
FOREIGN KEY (status_id) REFERENCES university_statuses (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE faculties
ADD CONSTRAINT faculties_universities_fk
FOREIGN KEY (university_id) REFERENCES universities (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE specializations
ADD CONSTRAINT specializations_education_levels_fk
FOREIGN KEY (education_level_id) REFERENCES education_levels (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE programs
ADD CONSTRAINT programs_faculties_fk
FOREIGN KEY (faculty_id) REFERENCES faculties (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE programs
ADD CONSTRAINT programs_specializations_fk
FOREIGN KEY (specialization_id) REFERENCES specializations (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE programs
ADD CONSTRAINT programs_study_forms_fk
FOREIGN KEY (study_form_id) REFERENCES study_forms (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE admission_conditions
ADD CONSTRAINT admission_conditions_programs_fk
FOREIGN KEY (program_id) REFERENCES programs (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE subject_min_scores
ADD CONSTRAINT subject_min_scores_subjects_fk
FOREIGN KEY (subject_id) REFERENCES subjects (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE program_subjects
ADD CONSTRAINT program_subjects_admission_conditions_fk
FOREIGN KEY (admission_condition_id) REFERENCES admission_conditions (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE program_subjects
ADD CONSTRAINT program_subjects_subjects_fk
FOREIGN KEY (subject_id) REFERENCES subjects (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE disciplines
ADD CONSTRAINT disciplines_programs_fk
FOREIGN KEY (program_id) REFERENCES programs (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE editor_invitations
ADD CONSTRAINT editor_invitations_universities_fk
FOREIGN KEY (university_id) REFERENCES universities (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE favorite_programs
ADD CONSTRAINT favorite_programs_users_fk
FOREIGN KEY (user_id) REFERENCES users (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE favorite_programs
ADD CONSTRAINT favorite_programs_programs_fk
FOREIGN KEY (program_id) REFERENCES programs (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE favorite_universities
ADD CONSTRAINT favorite_universities_users_fk
FOREIGN KEY (user_id) REFERENCES users (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE favorite_universities
ADD CONSTRAINT favorite_universities_universities_fk
FOREIGN KEY (university_id) REFERENCES universities (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE infrastructure
ADD CONSTRAINT infrastructure_infrastructure_types_fk
FOREIGN KEY (type_id) REFERENCES infrastructure_types (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE university_infrastructure
ADD CONSTRAINT university_infrastructure_universities_fk
FOREIGN KEY (university_id) REFERENCES universities (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE university_infrastructure
ADD CONSTRAINT university_infrastructure_infrastructure_fk
FOREIGN KEY (infrastructure_id) REFERENCES infrastructure (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE university_ratings
ADD CONSTRAINT university_ratings_universities_fk
FOREIGN KEY (university_id) REFERENCES universities (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE university_statistics
ADD CONSTRAINT university_statistics_universities_fk
FOREIGN KEY (university_id) REFERENCES universities (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE university_applications
ADD CONSTRAINT university_applications_users_fk
FOREIGN KEY (user_id) REFERENCES users (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE university_applications
ADD CONSTRAINT university_applications_users_fkv1
FOREIGN KEY (processed_by) REFERENCES users (id)
ON DELETE SET NULL ON UPDATE SET NULL;

ALTER TABLE university_applications
ADD CONSTRAINT university_applications_application_statuses_fk
FOREIGN KEY (status_id) REFERENCES application_statuses (id)
ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE university_employees
ADD CONSTRAINT university_employees_universities_fk
FOREIGN KEY (university_id) REFERENCES universities (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE university_employees
ADD CONSTRAINT university_employees_users_fk
FOREIGN KEY (user_id) REFERENCES users (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE search_history
ADD CONSTRAINT search_history_users_fk
FOREIGN KEY (user_id) REFERENCES users (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE specialization_subjects
ADD CONSTRAINT specialization_subjects_specializations_fk
FOREIGN KEY (specialization_id) REFERENCES specializations (id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE specialization_subjects
ADD CONSTRAINT specialization_subjects_subjects_fk
FOREIGN KEY (subject_id) REFERENCES subjects (id)
ON DELETE CASCADE ON UPDATE CASCADE;

