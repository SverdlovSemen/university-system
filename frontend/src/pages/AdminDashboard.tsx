import React from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header as="h5">Панель администратора</Card.Header>
                <Card.Body>
                    <Card.Title>Управление системой</Card.Title>

                    <Row className="mt-4">
                        <Col md={6}>
                            <Card>
                                <Card.Body>
                                    <Card.Title>Пользователи</Card.Title>
                                    <Card.Text>
                                        Управление учетными записями пользователей
                                    </Card.Text>
                                    <Button variant="outline-primary" onClick={() => navigate('/admin/users')}>Управление</Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6}>
                            <Card>
                                <Card.Body>
                                    <Card.Title>Статистика</Card.Title>
                                    <Card.Text>
                                        Просмотр статистики использования системы
                                    </Card.Text>
                                    <Button variant="outline-primary">Просмотр</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminDashboard;