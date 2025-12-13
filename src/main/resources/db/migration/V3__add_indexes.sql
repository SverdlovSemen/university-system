-- Создание индексов

CREATE INDEX subject_min_scores_year_idx ON subject_min_scores(year);
CREATE INDEX subject_min_scores_subject_id_idx ON subject_min_scores(subject_id);
CREATE INDEX universities_city_id_idx ON universities(city_id);
CREATE INDEX programs_faculty_id_idx ON programs(faculty_id);
CREATE INDEX programs_specialization_id_idx ON programs(specialization_id);
CREATE INDEX admission_conditions_program_id_idx ON admission_conditions(program_id);
CREATE INDEX admission_conditions_year_idx ON admission_conditions(year);
CREATE INDEX university_applications_status_id_idx ON university_applications(status_id);

