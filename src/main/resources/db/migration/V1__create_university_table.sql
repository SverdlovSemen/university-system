CREATE TABLE university (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    avg_ege_score DOUBLE PRECISION
);

INSERT INTO university (name, region, type, avg_ege_score)
VALUES
    ('МГУ', 'Москва', 'state', 85.5),
    ('СПбГУ', 'Санкт-Петербург', 'state', 82.0),
    ('КФУ', 'Казань', 'state', 78.5),
    ('НГУ', 'Новосибирск', 'state', 80.0),
    ('МФТИ', 'Москва', 'state', 87.0);