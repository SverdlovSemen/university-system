-- Добавляем новое поле для полного названия
ALTER TABLE university ADD COLUMN full_name VARCHAR(500) NOT NULL DEFAULT '';

-- Переименовываем существующее поле name в short_name
ALTER TABLE university RENAME COLUMN name TO short_name;

-- Обновляем существующие данные
UPDATE university SET
                      full_name = CASE id
                                      WHEN 1 THEN 'Московский государственный университет имени М.В. Ломоносова'
                                      WHEN 2 THEN 'Санкт-Петербургский государственный университет'
                                      WHEN 3 THEN 'Казанский федеральный университет'
                                      WHEN 4 THEN 'Новосибирский государственный университет'
                                      WHEN 5 THEN 'Московский физико-технический институт'
                                      ELSE short_name
                          END,
                      short_name = CASE id
                                       WHEN 1 THEN 'МГУ'
                                       WHEN 2 THEN 'СПбГУ'
                                       WHEN 3 THEN 'КФУ'
                                       WHEN 4 THEN 'НГУ'
                                       WHEN 5 THEN 'МФТИ'
                                       ELSE short_name
                          END;