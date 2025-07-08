import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const SearchPage = () => {
    const { user, isAuthenticated, hasRole } = useAuth();
    const navigate = useNavigate();

    return (
        <Container className="mt-4">
            <Card className="mb-4">
                <Card.Header as="h5">Поиск университетов</Card.Header>
                <Card.Body>
                    <Card.Title>Найдите идеальный университет</Card.Title>
                    <Card.Text>
                        Используйте наши фильтры, чтобы найти университет, соответствующий вашим требованиям.
                    </Card.Text>

                    {/* Блок фильтров поиска */}
                    <div className="mb-4 p-3 border rounded">
                        <h6>Фильтры поиска</h6>
                        <Row>
                            <Col md={4}>
                                <div className="mb-3">
                                    <label className="form-label">Регион</label>
                                    <select className="form-select">
                                        <option>Любой регион</option>
                                        <option>Москва</option>
                                        <option>Санкт-Петербург</option>
                                        {/* Другие регионы */}
                                    </select>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <label className="form-label">Специальность</label>
                                    <select className="form-select">
                                        <option>Любая специальность</option>
                                        <option>Информационные технологии</option>
                                        <option>Экономика</option>
                                        {/* Другие специальности */}
                                    </select>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <label className="form-label">Минимальный балл ЕГЭ</label>
                                    <input type="number" className="form-control" min="0" max="100" />
                                </div>
                            </Col>
                        </Row>
                        <Button variant="primary">Поиск</Button>
                    </div>

                    {/* Блок для зарегистрированных пользователей */}
                    {isAuthenticated && (
                        <div className="mt-4 p-3 border rounded bg-light">
                            <h5>Расширенные возможности</h5>
                            <p>Как зарегистрированный пользователь, вы можете:</p>
                            <ul>
                                <li>Сохранять понравившиеся университеты</li>
                                <li>Сравнивать университеты</li>
                                <li>Получать персональные рекомендации</li>
                                {hasRole('ROLE_ADMIN') && (
                                    <li>
                                        <Link to="/admin">Управлять системой (админ)</Link>
                                    </li>
                                )}
                                {hasRole('ROLE_EDITOR') && (
                                    <li>
                                        <Link to="/editor">Редактировать информацию о вузе (редактор)</Link>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Блок для неавторизованных пользователей */}
                    {!isAuthenticated && (
                        <div className="mt-4 p-3 border rounded bg-light">
                            <h5>Зарегистрируйтесь для доступа к расширенным возможностям</h5>
                            <p>Получите доступ к персональным рекомендациям, сохраняйте понравившиеся университеты и многое другое.</p>
                            <div className="d-flex gap-2">
                                <Button variant="primary" onClick={() => navigate('/register')}>
                                    Зарегистрироваться
                                </Button>
                                <Button variant="outline-primary" onClick={() => navigate('/login')}>
                                    Войти в аккаунт
                                </Button>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Блок с результатами поиска */}
            <Card>
                <Card.Header as="h5">Результаты поиска</Card.Header>
                <Card.Body>
                    <div className="list-group">
                        <div className="list-group-item">
                            <h5>Московский государственный университет</h5>
                            <p>Москва • Государственный • Средний балл: 85.5</p>
                            <Button variant="outline-primary" size="sm">
                                Подробнее
                            </Button>
                        </div>
                        <div className="list-group-item">
                            <h5>Санкт-Петербургский государственный университет</h5>
                            <p>Санкт-Петербург • Государственный • Средний балл: 82.0</p>
                            <Button variant="outline-primary" size="sm">
                                Подробнее
                            </Button>
                        </div>
                        {/* Другие результаты */}
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SearchPage;