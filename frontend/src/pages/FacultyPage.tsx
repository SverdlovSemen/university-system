import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Spinner, Button, ListGroup, Row, Col } from 'react-bootstrap';
import { getFacultyById, getFacultySpecialties } from '../api/facultyApi';
import { FacultyResponse, SpecialtyResponse } from '../types';
import { useAuth } from '../hooks/useAuth';

const FacultyPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [faculty, setFaculty] = useState<FacultyResponse | null>(null);
    const [specialties, setSpecialties] = useState<SpecialtyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (!id) return;

                const facultyData = await getFacultyById(parseInt(id));
                const specialtiesData = await getFacultySpecialties(parseInt(id));

                setFaculty(facultyData);
                setSpecialties(specialtiesData);
            } catch (error) {
                console.error('Ошибка загрузки данных факультета', error);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, navigate]);

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
                <p>Загрузка информации о факультете...</p>
            </Container>
        );
    }

    if (!faculty) {
        return (
            <Container className="mt-4">
                <Card>
                    <Card.Body className="text-center">
                        <Card.Title>Факультет не найден</Card.Title>
                        <Button variant="primary" onClick={() => navigate('/')}>
                            Вернуться на главную
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
                ← Назад
            </Button>

            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <Card.Title>{faculty.name}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                                {faculty.university.shortName}
                            </Card.Subtitle>
                            <Card.Text>
                                {faculty.description || 'Описание факультета отсутствует'}
                            </Card.Text>
                        </Col>
                        <Col md={4} className="d-flex align-items-center justify-content-end">
                            <Button
                                variant="outline-primary"
                                onClick={() => navigate(`/university/${faculty.university.id}`)}
                            >
                                Перейти к университету
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header as="h5">Специальности факультета</Card.Header>
                <Card.Body>
                    {specialties.length === 0 ? (
                        <p className="text-center text-muted">
                            На факультете пока нет специальностей
                        </p>
                    ) : (
                        <ListGroup variant="flush">
                            {specialties.map(specialty => (
                                <ListGroup.Item
                                    key={specialty.id}
                                    action
                                    onClick={() => navigate(`/specialty/${specialty.id}`)}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5>{specialty.name}</h5>
                                            <div className="text-muted">
                                                Код программы: {specialty.programCode}
                                            </div>
                                            <p className="mb-0">{specialty.description}</p>
                                        </div>
                                        <Button variant="outline-info">Подробнее</Button>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default FacultyPage;