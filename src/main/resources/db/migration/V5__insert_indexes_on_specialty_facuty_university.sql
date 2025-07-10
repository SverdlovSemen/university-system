-- Для быстрого поиска по специальностям
CREATE INDEX idx_specialty_faculty_id ON specialty(faculty_id);

-- Для быстрого поиска по факультетам
CREATE INDEX idx_faculty_university_id ON faculty(university_id);

-- Для сортировки по рейтингу
CREATE INDEX idx_university_ranking ON university(country_ranking);