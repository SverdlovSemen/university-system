CREATE TABLE faculty_specialty (
                                   faculty_id BIGINT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
                                   specialty_id BIGINT NOT NULL REFERENCES specialty(id) ON DELETE CASCADE,
                                   PRIMARY KEY (faculty_id, specialty_id)
);

-- Переносим существующие связи из таблицы specialty
INSERT INTO faculty_specialty (faculty_id, specialty_id)
SELECT faculty_id, id FROM specialty;

-- Удаляем столбец faculty_id из таблицы specialty
ALTER TABLE specialty DROP COLUMN faculty_id;