import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAdminStats, AdminStats } from '../api/adminApi';

const AdminPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalUniversities: 0,
        totalPrograms: 0,
        pendingApplications: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSystemStats();
    }, []);

    const fetchSystemStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAdminStats();
            setStats(data);
        } catch (err: any) {
            console.error('Ошибка загрузки статистики:', err);
            setError('Не удалось загрузить статистику. Попробуйте обновить страницу.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <Container className="mt-4">
            <h2 className="mb-4">
                <Badge bg="danger" className="me-2">ADMIN</Badge>
                Панель администратора сайта
            </h2>
            
            <Card className="mb-4">
                <Card.Header as="h5">Добро пожаловать, {user?.firstName}!</Card.Header>
                <Card.Body>
                    <Card.Text>
                        Вы вошли в панель администратора сайта с полными правами доступа.
                    </Card.Text>
                </Card.Body>
            </Card>

            {/* Сообщение об ошибке */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Индикатор загрузки */}
            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </Spinner>
                    <p className="mt-2">Загрузка статистики...</p>
                </div>
            )}

            {/* Статистика системы */}
            {!loading && <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-primary">{stats.totalUsers}</h3>
                            <Card.Text>Всего пользователей</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-success">{stats.totalUniversities}</h3>
                            <Card.Text>Университетов</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-info">{stats.totalPrograms}</h3>
                            <Card.Text>Программ обучения</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-warning">{stats.pendingApplications}</h3>
                            <Card.Text>Заявки Ожидают обработки</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>}

            {/* Основные функции администратора */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>
                                <i className="bi bi-building me-2"></i>
                                Заявки университетов
                            </Card.Title>
                            <Card.Text>
                                Обработка заявок на добавление новых университетов в систему.
                            </Card.Text>
                            <Button 
                                variant="success" 
                                onClick={() => navigate('/admin/applications')}
                                className="w-100"
                            >
                                Перейти
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

            </Row>


        </Container>
    );
};

export default AdminPage;

