-- Обновление ролей на формат Spring Security

-- Обновляем существующие роли на стандартные имена с префиксом ROLE_
UPDATE roles SET name = 'ROLE_ADMIN' WHERE name = 'Администратор сайта';
UPDATE roles SET name = 'ROLE_UNIVERSITY_ADMIN' WHERE name = 'Администратор университета';
UPDATE roles SET name = 'ROLE_EDITOR' WHERE name = 'Редактор университета';
UPDATE roles SET name = 'ROLE_USER' WHERE name = 'Обычный пользователь';

-- Также обновляем статусы пользователей для консистентности
UPDATE user_statuses SET name = 'ACTIVE' WHERE name = 'Активный';
UPDATE user_statuses SET name = 'BLOCKED' WHERE name = 'Заблокированный';