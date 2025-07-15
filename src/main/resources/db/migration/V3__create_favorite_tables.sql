-- Таблица для избранных университетов
CREATE TABLE user_favorite_university (
                                          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                          university_id BIGINT NOT NULL REFERENCES university(id) ON DELETE CASCADE,
                                          PRIMARY KEY (user_id, university_id)
);

-- Таблица для избранных специальностей
CREATE TABLE user_favorite_specialty (
                                         user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                         specialty_id BIGINT NOT NULL REFERENCES specialty(id) ON DELETE CASCADE,
                                         PRIMARY KEY (user_id, specialty_id)
);