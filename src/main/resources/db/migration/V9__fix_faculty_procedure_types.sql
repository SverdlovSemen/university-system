-- Скрипт для обновления процедуры safe_move_programs_and_delete_faculty
-- Flyway миграция V9

-- Удаляем старые версии процедуры с разными типами параметров
DROP PROCEDURE IF EXISTS safe_move_programs_and_delete_faculty(INTEGER, INTEGER, BOOLEAN);
DROP PROCEDURE IF EXISTS safe_move_programs_and_delete_faculty(BIGINT, BIGINT, BOOLEAN);

CREATE OR REPLACE PROCEDURE safe_move_programs_and_delete_faculty(
    p_source_faculty_id BIGINT,
    p_target_faculty_id BIGINT,
    p_validate_university_match BOOLEAN DEFAULT TRUE
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_faculty faculties%ROWTYPE;
    v_target_faculty faculties%ROWTYPE;
    v_programs_moved INTEGER := 0;
    v_related_records RECORD;
BEGIN
    -- Блокируем записи для избежания конкурентных изменений
    BEGIN
        SELECT * INTO v_source_faculty
        FROM faculties
        WHERE id = p_source_faculty_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Факультет с ID % не найден', p_source_faculty_id;
        END IF;

        SELECT * INTO v_target_faculty
        FROM faculties
        WHERE id = p_target_faculty_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Факультет с ID % не найден', p_target_faculty_id;
        END IF;
    END;

    -- Дополнительная проверка на один университет
    IF p_validate_university_match AND
       v_source_faculty.university_id != v_target_faculty.university_id THEN
        RAISE EXCEPTION
            'Факультеты принадлежат разным университетам: % (университет %) и % (университет %).',
            p_source_faculty_id, v_source_faculty.university_id,
            p_target_faculty_id, v_target_faculty.university_id;
    END IF;

    -- Перемещаем программы
    WITH moved AS (
        UPDATE programs
        SET
            faculty_id = p_target_faculty_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE faculty_id = p_source_faculty_id
        RETURNING id
    )
    SELECT COUNT(*) INTO v_programs_moved
    FROM moved;

    -- Проверяем другие связи факультета
    -- (если в будущем добавятся новые таблицы)

    -- Удаляем факультет
    DELETE FROM faculties
    WHERE id = p_source_faculty_id;

    RAISE NOTICE 'Успешно перемещено % программ с факультета % на факультет %',
        v_programs_moved, p_source_faculty_id, p_target_faculty_id;
END;
$$;

