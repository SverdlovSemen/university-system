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
    short_name VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL DEFAULT '',
    type VARCHAR(50) NOT NULL,
    avg_ege_score DOUBLE PRECISION,
    country_ranking INTEGER,
    city_id BIGINT NOT NULL REFERENCES city(id) ON DELETE CASCADE
);

-- Создание индекса для сортировки по рейтингу университетов
CREATE INDEX idx_university_ranking ON university(country_ranking);

-- Создание таблицы факультетов
CREATE TABLE faculty (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    university_id BIGINT NOT NULL REFERENCES university(id) ON DELETE CASCADE
);

-- Создание индекса для быстрого поиска по факультетам
CREATE INDEX idx_faculty_university_id ON faculty(university_id);

-- Создание таблицы специальностей
CREATE TABLE specialty (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    program_code VARCHAR(50) NOT NULL,
    description TEXT,
    faculty_id BIGINT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE
);

-- Создание индекса для быстрого поиска по специальностям
CREATE INDEX idx_specialty_faculty_id ON specialty(faculty_id);

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

-- Создание таблицы пользователей
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY, -- Используем BIGINT сразу
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE
);

-- Создание таблицы ролей
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY, -- Используем BIGINT сразу
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Создание таблицы связи пользователей и ролей
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);