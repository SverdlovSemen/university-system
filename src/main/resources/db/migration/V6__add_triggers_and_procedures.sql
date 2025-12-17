-- =========================================
-- Функция проверки допустимости предмета
-- для программы бакалавриата / специалитета
-- =========================================
CREATE OR REPLACE FUNCTION check_program_subject_validity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
v_specialization_id INTEGER;
    v_subject_exists BOOLEAN;
    v_program_id INTEGER;
    v_education_level VARCHAR(255);
BEGIN
    -- Получаем program_id из admission_conditions
SELECT ac.program_id
INTO v_program_id
FROM admission_conditions ac
WHERE ac.id = NEW.admission_condition_id;

IF v_program_id IS NULL THEN
        RAISE EXCEPTION
            'Не найдена программа для условия поступления с ID %',
            NEW.admission_condition_id;
END IF;

    -- Получаем specialization_id и уровень образования
SELECT
    p.specialization_id,
    el.name
INTO
    v_specialization_id,
    v_education_level
FROM programs p
         JOIN specializations sp ON sp.id = p.specialization_id
         JOIN education_levels el ON el.id = sp.education_level_id
WHERE p.id = v_program_id;

IF v_specialization_id IS NULL THEN
        RAISE EXCEPTION
            'Не найдена специализация для программы с ID %',
            v_program_id;
END IF;

    -- Проверяем только бакалавриат и специалитет
    IF v_education_level IN ('Бакалавриат', 'Специалитет') THEN
SELECT EXISTS (
    SELECT 1
    FROM specialization_subjects ss
    WHERE ss.specialization_id = v_specialization_id
      AND ss.subject_id = NEW.subject_id
)
INTO v_subject_exists;

IF NOT v_subject_exists THEN
            RAISE EXCEPTION
                'Предмет с ID % не принадлежит специализации программы. Program ID: %, Specialization ID: %, Education Level: %',
                NEW.subject_id,
                v_program_id,
                v_specialization_id,
                v_education_level;
END IF;
END IF;

RETURN NEW;
END;
$$;

-- =========================================
-- Триггер
-- =========================================
DROP TRIGGER IF EXISTS validate_program_subject
ON program_subjects;

CREATE TRIGGER validate_program_subject
    BEFORE INSERT OR UPDATE
                         ON program_subjects
                         FOR EACH ROW
                         EXECUTE FUNCTION check_program_subject_validity();




-- =========================================
-- Процедура добавления сотрудника университета
-- (users + university_employees)
-- =========================================
DROP PROCEDURE IF EXISTS add_university_employee;

CREATE OR REPLACE PROCEDURE add_university_employee(
    p_email VARCHAR(255),
    p_password VARCHAR(255),
    p_first_name VARCHAR(255),
    p_role_name VARCHAR(255),
    p_status_name VARCHAR(255),
    p_university_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
v_user_id INTEGER;
    v_role_id INTEGER;
    v_status_id INTEGER;
BEGIN
    -- Получаем ID роли
SELECT id
INTO v_role_id
FROM roles
WHERE name = p_role_name;

IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Роль "%" не найдена', p_role_name;
END IF;

    -- Проверяем допустимые роли
    IF p_role_name NOT IN ('ROLE_UNIVERSITY_ADMIN', 'ROLE_EDITOR') THEN
        RAISE EXCEPTION
            'Роль "%" не поддерживается для сотрудников университета. Допустимы: "ROLE_UNIVERSITY_ADMIN", "ROLE_EDITOR"',
            p_role_name;
END IF;

    -- Получаем ID статуса пользователя
SELECT id
INTO v_status_id
FROM user_statuses
WHERE name = p_status_name;

IF v_status_id IS NULL THEN
        RAISE EXCEPTION 'Статус пользователя "%" не найден', p_status_name;
END IF;

    -- Проверяем уникальность email
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE email = p_email
    ) THEN
        RAISE EXCEPTION 'Пользователь с email "%" уже существует', p_email;
END IF;

    -- Проверяем существование университета
    IF NOT EXISTS (
        SELECT 1
        FROM universities
        WHERE id = p_university_id
    ) THEN
        RAISE EXCEPTION 'Университет с ID % не найден', p_university_id;
END IF;

    -- Вставляем пользователя
INSERT INTO users (
    email,
    password,
    first_name,
    role_id,
    status_id,
    created_at,
    updated_at
)
VALUES (
           p_email,
           p_password,
           p_first_name,
           v_role_id,
           v_status_id,
           NOW(),
           NOW()
       )
    RETURNING id INTO v_user_id;

-- Связываем пользователя с университетом
INSERT INTO university_employees (
    university_id,
    user_id
)
VALUES (
           p_university_id,
           v_user_id
       );

RAISE NOTICE
        'Сотрудник "%" добавлен в университет ID % с ролью "%"',
        p_email,
        p_university_id,
        p_role_name;
END;
$$;



-- =========================================
-- Функция проверки, что processed_by
-- является администратором сайта
-- =========================================
CREATE OR REPLACE FUNCTION check_processed_by_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
v_role_name VARCHAR(255);
BEGIN
    -- Проверяем только если processed_by задан
    IF NEW.processed_by IS NOT NULL THEN

        -- Получаем имя роли пользователя
SELECT r.name
INTO v_role_name
FROM users u
         JOIN roles r ON r.id = u.role_id
WHERE u.id = NEW.processed_by;

-- Пользователь не найден
IF v_role_name IS NULL THEN
            RAISE EXCEPTION
                'Пользователь с ID % не существует',
                NEW.processed_by;
END IF;

        -- Проверяем роль
        IF v_role_name <> 'ROLE_ADMIN' THEN
            RAISE EXCEPTION
                'Только пользователь с ролью "ROLE_ADMIN" может обрабатывать заявки. У пользователя ID % роль: "%"',
                NEW.processed_by,
                v_role_name;
END IF;

END IF;

RETURN NEW;
END;
$$;

-- =========================================
-- Триггер
-- =========================================
DROP TRIGGER IF EXISTS validate_processed_by_admin
ON university_applications;

CREATE TRIGGER validate_processed_by_admin
    BEFORE INSERT OR UPDATE
                         ON university_applications
                         FOR EACH ROW
                         EXECUTE FUNCTION check_processed_by_admin();



-- =========================================
-- Функция проверки минимального балла
-- по предмету для бакалавриата/специалитета
-- =========================================
CREATE OR REPLACE FUNCTION check_program_subject_min_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
v_education_level_name VARCHAR(255);
    v_subject_min_score INTEGER;
    v_admission_year INTEGER;
BEGIN
    -- Получаем уровень образования и год поступления
SELECT
    el.name,
    ac.year
INTO
    v_education_level_name,
    v_admission_year
FROM admission_conditions ac
         JOIN programs p ON p.id = ac.program_id
         JOIN specializations sp ON sp.id = p.specialization_id
         JOIN education_levels el ON el.id = sp.education_level_id
WHERE ac.id = NEW.admission_condition_id;

IF NOT FOUND THEN
        RAISE EXCEPTION
            'Не найдено условие поступления или специализация для admission_condition_id = %',
            NEW.admission_condition_id;
END IF;

    -- Нормализуем имя уровня образования
    v_education_level_name := TRIM(LOWER(v_education_level_name));

    -- Проверяем только бакалавриат и специалитет
    IF v_education_level_name IN ('бакалавриат', 'специалитет') THEN

        -- Минимальный балл по предмету в заданном году
SELECT min_score
INTO v_subject_min_score
FROM subject_min_scores
WHERE subject_id = NEW.subject_id
          AND year = v_admission_year;

IF v_subject_min_score IS NULL THEN
            RAISE EXCEPTION
                'Для предмета ID % не установлен минимальный балл на % год. Обратитесь к справочнику subject_min_scores.',
                NEW.subject_id,
                v_admission_year;
END IF;

        -- Проверка на соответствие минимальному баллу
        IF NEW.min_score < v_subject_min_score THEN
            RAISE EXCEPTION
                'Минимальный балл по предмету (%) не может быть ниже установленного на % год (%).',
                NEW.min_score,
                v_admission_year,
                v_subject_min_score;
END IF;

        -- Защита от некорректных значений
        IF NEW.min_score < 0 OR NEW.min_score > 100 THEN
            RAISE EXCEPTION
                'Минимальный балл (%) выходит за допустимый диапазон (0–100).',
                NEW.min_score;
END IF;

END IF;

RETURN NEW;
END;
$$;

-- =========================================
-- Триггер
-- =========================================
DROP TRIGGER IF EXISTS validate_program_subject_min_score
ON program_subjects;

CREATE TRIGGER validate_program_subject_min_score
    BEFORE INSERT OR UPDATE
                         ON program_subjects
                         FOR EACH ROW
                         EXECUTE FUNCTION check_program_subject_min_score();




-- =========================================
-- Процедура повышения пользователя
-- до сотрудника университета
-- =========================================
DROP PROCEDURE IF EXISTS promote_user_to_university_staff;

CREATE OR REPLACE PROCEDURE promote_user_to_university_staff(
    p_user_id INTEGER,
    p_university_id INTEGER,
    p_new_role_name VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
DECLARE
v_role_id INTEGER;
    v_user_exists BOOLEAN;
    v_university_exists BOOLEAN;
    v_current_role VARCHAR(255);
BEGIN
    -- Проверяем существование пользователя
SELECT EXISTS (
    SELECT 1 FROM users WHERE id = p_user_id
)
INTO v_user_exists;

IF NOT v_user_exists THEN
        RAISE EXCEPTION
            'Пользователь с ID % не найден',
            p_user_id;
END IF;

    -- Проверяем существование университета
SELECT EXISTS (
    SELECT 1 FROM universities WHERE id = p_university_id
)
INTO v_university_exists;

IF NOT v_university_exists THEN
        RAISE EXCEPTION
            'Университет с ID % не найден',
            p_university_id;
END IF;

    -- Проверяем допустимость роли
    IF p_new_role_name NOT IN ('ROLE_UNIVERSITY_ADMIN', 'ROLE_EDITOR') THEN
        RAISE EXCEPTION
            'Роль "%" не поддерживается. Допустимы только: "ROLE_UNIVERSITY_ADMIN", "ROLE_EDITOR"',
            p_new_role_name;
END IF;

    -- Получаем ID новой роли
SELECT id
INTO v_role_id
FROM roles
WHERE name = p_new_role_name;

IF v_role_id IS NULL THEN
        RAISE EXCEPTION
            'Роль "%" не найдена в системе',
            p_new_role_name;
END IF;

    -- Получаем текущую роль пользователя
SELECT r.name
INTO v_current_role
FROM users u
         JOIN roles r ON r.id = u.role_id
WHERE u.id = p_user_id;

-- Удаляем избранные университеты
DELETE FROM favorite_universities
WHERE user_id = p_user_id;

-- Удаляем избранные программы
DELETE FROM favorite_programs
WHERE user_id = p_user_id;

-- Обновляем роль пользователя
UPDATE users
SET role_id = v_role_id,
    updated_at = CURRENT_TIMESTAMP
WHERE id = p_user_id;

-- Добавляем пользователя в сотрудники университета
INSERT INTO university_employees (university_id, user_id)
VALUES (p_university_id, p_user_id)
    ON CONFLICT (university_id, user_id)
    DO NOTHING;

RAISE NOTICE
        'Пользователь ID % повышен до роли "%". Добавлен в университет ID %',
        p_user_id,
        p_new_role_name,
        p_university_id;

    IF v_current_role IS NOT NULL THEN
        RAISE NOTICE
            'Предыдущая роль пользователя: "%"',
            v_current_role;
END IF;
END;
$$;






-- =========================================
-- Процедура копирования условий поступления
-- на новый учебный год
-- =========================================
DROP PROCEDURE IF EXISTS copy_admission_conditions_to_year;

CREATE OR REPLACE PROCEDURE copy_admission_conditions_to_year(
    p_source_condition_id INTEGER,
    p_target_year INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
v_program_id INTEGER;
    v_source_year INTEGER;
    v_new_condition_id INTEGER;

    v_subject_id INTEGER;
    v_exam_number INTEGER;
    v_old_min_score NUMERIC;

    v_global_min_score INTEGER;
    v_effective_min_score NUMERIC;
BEGIN
    -- Проверяем существование исходных условий
SELECT
    program_id,
    year
INTO
    v_program_id,
    v_source_year
FROM admission_conditions
WHERE id = p_source_condition_id;

IF NOT FOUND THEN
        RAISE EXCEPTION
            'Условия приёма с ID % не найдены',
            p_source_condition_id;
END IF;

    -- Проверяем, что условий для целевого года ещё нет
    IF EXISTS (
        SELECT 1
        FROM admission_conditions
        WHERE program_id = v_program_id
          AND year = p_target_year
    ) THEN
        RAISE EXCEPTION
            'Условия приёма для программы % на % год уже существуют',
            v_program_id,
            p_target_year;
END IF;

    -- Создаём новые условия поступления
INSERT INTO admission_conditions (
    program_id,
    admission_fee,
    year,
    passing_score,
    has_dvi,
    budget_places,
    targeted_places,
    paid_places
)
SELECT
    program_id,
    admission_fee,
    p_target_year,
    passing_score,
    has_dvi,
    budget_places,
    targeted_places,
    paid_places
FROM admission_conditions
WHERE id = p_source_condition_id
    RETURNING id INTO v_new_condition_id;

-- Копируем предметы с корректировкой минимального балла
FOR v_subject_id, v_exam_number, v_old_min_score IN
SELECT
    subject_id,
    exam_number,
    min_score
FROM program_subjects
WHERE admission_condition_id = p_source_condition_id
    LOOP
-- Глобальный минимальный балл на целевой год
SELECT min_score
INTO v_global_min_score
FROM subject_min_scores
WHERE subject_id = v_subject_id
          AND year = p_target_year;

IF v_global_min_score IS NULL THEN
            RAISE EXCEPTION
                'Не задан минимальный балл по предмету ID % на % год. Добавьте запись в subject_min_scores.',
                v_subject_id,
                p_target_year;
END IF;

        -- Выбираем максимальный из локального и глобального минимума
        v_effective_min_score :=
            GREATEST(v_old_min_score, v_global_min_score::NUMERIC);

        -- Вставляем предмет для новых условий
INSERT INTO program_subjects (
    admission_condition_id,
    subject_id,
    exam_number,
    min_score
)
VALUES (
           v_new_condition_id,
           v_subject_id,
           v_exam_number,
           v_effective_min_score
       );
END LOOP;

    RAISE NOTICE
        'Условия приёма успешно скопированы: источник ID % (год %) → новый год % (ID %)',
        p_source_condition_id,
        v_source_year,
        p_target_year,
        v_new_condition_id;
END;
$$;
