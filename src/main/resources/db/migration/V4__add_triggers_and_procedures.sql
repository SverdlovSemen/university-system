-- 1. Триггер: проверка соответствия предметов специализации для бакалавриата/специалитета

CREATE OR REPLACE FUNCTION check_program_subject_validity()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    v_specialization_id INTEGER;
    v_subject_exists BOOLEAN;
    v_program_id INTEGER;
    v_education_level VARCHAR(255);
BEGIN
    -- Получаем program_id из admission_conditions
    SELECT ac.program_id INTO v_program_id
    FROM admission_conditions ac
    WHERE ac.id = NEW.admission_condition_id;
    
    IF v_program_id IS NULL THEN
        RAISE EXCEPTION 'Не найдена программа для условия поступления с ID %', NEW.admission_condition_id;
    END IF;
    
    -- Получаем specialization_id и уровень образования из программы
    SELECT p.specialization_id, el.name INTO v_specialization_id, v_education_level
    FROM programs p
    INNER JOIN specializations sp ON p.specialization_id = sp.id
    INNER JOIN education_levels el ON sp.education_level_id = el.id
    WHERE p.id = v_program_id;
    
    IF v_specialization_id IS NULL THEN
        RAISE EXCEPTION 'Не найдена специализация для программы с ID %', v_program_id;
    END IF;
    
    -- Проверяем только для бакалавриата и специалитета
    IF v_education_level IN ('Бакалавриат', 'Специалитет') THEN
        -- Проверяем, существует ли предмет в специализации
        SELECT EXISTS(
            SELECT 1 
            FROM specialization_subjects ss 
            WHERE ss.specialization_id = v_specialization_id 
            AND ss.subject_id = NEW.subject_id
        ) INTO v_subject_exists;
        
        -- Если предмет не найден в специализации, выдаем ошибку
        IF NOT v_subject_exists THEN
            RAISE EXCEPTION 
                'Предмет с ID % не принадлежит специализации программы. Program ID: %, Specialization ID: %, Education Level: %', 
                NEW.subject_id, v_program_id, v_specialization_id, v_education_level;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_program_subject
    BEFORE INSERT OR UPDATE ON program_subjects
    FOR EACH ROW
    EXECUTE FUNCTION check_program_subject_validity();

-- 2. Процедура: добавление сотрудника университета

CREATE OR REPLACE PROCEDURE add_university_employee(
    p_email VARCHAR(255),
    p_password VARCHAR(255),  
    p_first_name VARCHAR(255),
    p_role_name VARCHAR(255),  
    p_status_name VARCHAR(255),
    p_university_id INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    v_user_id INTEGER;
    v_role_id INTEGER;
    v_status_id INTEGER;
BEGIN
    -- Получаем ID роли по имени
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Роль "%" не найдена', p_role_name;
    END IF;

    -- Проверяем, что роль — админ или редактор университета
    IF p_role_name NOT IN ('Администратор университета', 'Редактор университета') THEN
        RAISE EXCEPTION 
            'Роль "%" не поддерживается для сотрудников университета. Допустимы: "Администратор университета", "Редактор университета"',
            p_role_name;
    END IF;

    -- Получаем ID статуса
    SELECT id INTO v_status_id FROM user_statuses WHERE name = p_status_name;
    IF v_status_id IS NULL THEN
        RAISE EXCEPTION 'Статус пользователя "%" не найден', p_status_name;
    END IF;

    -- Проверяем уникальность email
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'Пользователь с email "%" уже существует', p_email;
    END IF;

    -- Проверяем существование университета
    IF NOT EXISTS (SELECT 1 FROM universities WHERE id = p_university_id) THEN
        RAISE EXCEPTION 'Университет с ID % не найден', p_university_id;
    END IF;

    -- Вставляем пользователя
    INSERT INTO users (email, password, first_name, role_id, status_id, created_at, updated_at)
    VALUES (p_email, p_password, p_first_name, v_role_id, v_status_id, NOW(), NOW())
    RETURNING id INTO v_user_id;

    -- Связываем с университетом
    INSERT INTO university_employees (university_id, user_id)
    VALUES (p_university_id, v_user_id);

    RAISE NOTICE 'Сотрудник "%" добавлен в университет ID % с ролью "%"', 
        p_email, p_university_id, p_role_name;
END;
$$;

-- 3. Триггер: проверка, что processed_by — только администратор сайта

CREATE OR REPLACE FUNCTION check_processed_by_admin()
RETURNS TRIGGER AS $$
DECLARE
    v_role_name VARCHAR(255);
BEGIN
    -- Проверяем только если processed_by указан (не NULL)
    IF NEW.processed_by IS NOT NULL THEN
        -- Получаем имя роли пользователя
        SELECT r.name INTO v_role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = NEW.processed_by;

        -- Пользователь не найден
        IF v_role_name IS NULL THEN
            RAISE EXCEPTION 'Пользователь с ID % не существует', NEW.processed_by;
        END IF;

        -- Проверяем имя роли 
        IF v_role_name != 'Администратор сайта' THEN
            RAISE EXCEPTION 
                'Только пользователь с ролью "Администратор сайта" может обрабатывать заявки. У пользователя ID % роль: "%"',
                NEW.processed_by, v_role_name;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_processed_by_admin
BEFORE INSERT OR UPDATE ON university_applications
FOR EACH ROW
EXECUTE FUNCTION check_processed_by_admin();

-- 4. Триггер: проверка минимального балла по предмету

CREATE OR REPLACE FUNCTION check_program_subject_min_score()
RETURNS TRIGGER AS $$
DECLARE
    v_education_level_name VARCHAR(255);
    v_subject_min_score INTEGER;
    v_admission_year INTEGER;
BEGIN
    -- Получаем уровень образования и год одной выборкой
    SELECT 
        el.name, 
        ac.year 
    INTO 
        v_education_level_name, 
        v_admission_year
    FROM admission_conditions ac
    JOIN programs p ON ac.program_id = p.id
    JOIN specializations sp ON p.specialization_id = sp.id
    JOIN education_levels el ON sp.education_level_id = el.id
    WHERE ac.id = NEW.admission_condition_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Не найдено условие поступления или специализация для admission_condition_id = %', NEW.admission_condition_id;
    END IF;

    -- Приводим к нормализованному виду
    v_education_level_name := TRIM(LOWER(v_education_level_name));

    -- Проверяем только для бакалавриата и специалитета
    IF v_education_level_name IN ('бакалавриат', 'специалитет') THEN
        -- Минимальный балл предмета в указанном году
        SELECT min_score INTO v_subject_min_score
        FROM subject_min_scores
        WHERE subject_id = NEW.subject_id AND year = v_admission_year;

        -- Если min_score не задан — это ошибка данных (ФИПИ обязан публиковать)
        IF v_subject_min_score IS NULL THEN
            RAISE EXCEPTION 
                'Для предмета ID % не установлен минимальный балл на % год. Обратитесь к справочнику subject_min_scores.',
                NEW.subject_id, v_admission_year;
        END IF;

        -- Проверяем, что min_score в программе ≥ установленного
        IF NEW.min_score < v_subject_min_score THEN
            RAISE EXCEPTION 
                'Минимальный балл по предмету (%) не может быть ниже установленного ФИПИ на % год (%).',
                NEW.min_score, v_admission_year, v_subject_min_score;
        END IF;

        -- Доп: защита от отрицательных/некорректных значений
        IF NEW.min_score < 0 OR NEW.min_score > 100 THEN
            RAISE EXCEPTION 
                'Минимальный балл (%) выходит за допустимый диапазон (0–100).',
                NEW.min_score;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_program_subject_min_score
BEFORE INSERT OR UPDATE ON program_subjects
FOR EACH ROW
EXECUTE FUNCTION check_program_subject_min_score();

-- 5. Триггер: актуальность аккредитации вуза

CREATE OR REPLACE FUNCTION check_accreditation_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Аккредитация не должна истекать в прошлом
    IF NEW.accreditation_expiry_date < CURRENT_DATE THEN
        RAISE EXCEPTION 
            'Дата окончания аккредитации (%) не может быть в прошлом', 
            NEW.accreditation_expiry_date;
    END IF;

    -- Опционально: макс. срок — 6 лет (по закону РФ)
    IF NEW.accreditation_expiry_date > (CURRENT_DATE + INTERVAL '6 years') THEN
        RAISE EXCEPTION 
            'Срок аккредитации не может превышать 6 лет. Указано: %', 
            NEW.accreditation_expiry_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_accreditation_check
BEFORE INSERT OR UPDATE ON universities
FOR EACH ROW
EXECUTE FUNCTION check_accreditation_expiry();

