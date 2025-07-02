-- Создание таблицы регионов
CREATE TABLE region (
                        id BIGSERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL
);

-- Создание таблицы городов
CREATE TABLE city (
                      id BIGSERIAL PRIMARY KEY,
                      name VARCHAR(100) NOT NULL,
                      region_id BIGINT NOT NULL REFERENCES region(id) ON DELETE CASCADE
);

-- Создание таблицы университетов
CREATE TABLE university (
                            id BIGSERIAL PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            type VARCHAR(50) NOT NULL,
                            avg_ege_score DOUBLE PRECISION,
                            country_ranking INTEGER,
                            city_id BIGINT NOT NULL REFERENCES city(id) ON DELETE CASCADE
);

-- Создание таблицы факультетов
CREATE TABLE faculty (
                         id BIGSERIAL PRIMARY KEY,
                         name VARCHAR(255) NOT NULL,
                         university_id BIGINT NOT NULL REFERENCES university(id) ON DELETE CASCADE
);

-- Создание таблицы специальностей
CREATE TABLE specialty (
                           id BIGSERIAL PRIMARY KEY,
                           name VARCHAR(255) NOT NULL,
                           program_code VARCHAR(50) NOT NULL,
                           description TEXT,
                           faculty_id BIGINT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE
);

-- Создание таблицы предметов
CREATE TABLE subject (
                         id BIGSERIAL PRIMARY KEY,
                         name VARCHAR(100) NOT NULL UNIQUE
);

-- Создание таблицы комбинаций предметов
CREATE TABLE subject_combination (
                                     id BIGSERIAL PRIMARY KEY,
                                     specialty_id BIGINT NOT NULL REFERENCES specialty(id) ON DELETE CASCADE
);

-- Создание таблицы требуемых предметов
CREATE TABLE required_subject (
                                  combination_id BIGINT NOT NULL REFERENCES subject_combination(id) ON DELETE CASCADE,
                                  subject_id BIGINT NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
                                  PRIMARY KEY (combination_id, subject_id)
);