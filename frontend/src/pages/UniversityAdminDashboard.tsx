import React from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const UniversityAdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header as="h5">Панель администратора университета</Card.Header>
                <Card.Body>
                    <Card.Title>Управление университетом</Card.Title>

                    <Row className="mt-4">
                        <Col md={6}>
                            <Card>
                                <Card.Body>
                                    <Card.Title>Пользователи</Card.Title>
                                    <Card.Text>Просмотр всех пользователей и назначение редакторов для вашего университета</Card.Text>
                                    <Button variant="outline-primary" onClick={() => navigate('/university-admin/users')}>Управление</Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6}>
                            <Card>
                                <Card.Body>
                                    <Card.Title>Редакторы</Card.Title>
                                    <Card.Text>Приглашайте и удаляйте редакторов вашего университета</Card.Text>
                                    <Button variant="outline-primary" onClick={() => navigate('/university-admin/editors')}>Управление редакторами</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default UniversityAdminDashboard;
