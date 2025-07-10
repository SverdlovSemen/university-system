import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Row, Col, ListGroup, Tab, Tabs } from 'react-bootstrap';
import { getUniversityById } from '../api/universityApi';
import { fetchSpecialtiesByUniversity } from '../api/specialtyApi';
import { UniversityResponse, SpecialtyResponse, SubjectResponse } from '../types';
import { useAuth } from '../hooks/useAuth';

const UniversityPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [university, setUniversity] = useState<UniversityResponse | null>(null);
    const [specialties, setSpecialties] = useState<SpecialtyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('faculties');

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                if (!id) return;

                const universityData = await getUniversityById(parseInt(id));
                const specialtiesData = await fetchSpecialtiesByUniversity(parseInt(id));

                if (isMounted) {
                    setUniversity(universityData);
                    setSpecialties(specialtiesData || []);
                }
            } catch (error) {
                console.error('Ошибка загрузки данных', error);
                navigate('/');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [id, navigate]);

    const handleAddToFavorites = () => {
        console.log('Добавлено в избранное:', university?.id);
    };

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (!university) {
        return (
            <Container className="mt-4">
                <h2>Университет не найден</h2>
                <Button variant="primary" onClick={() => navigate('/')}>
                    Вернуться на главную
                </Button>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
                Назад к результатам
            </Button>

            <Card>
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            {/* Исправлено: используем shortName и fullName */}
                            <Card.Title>{university.shortName}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                                {university.fullName}
                            </Card.Subtitle>
                            <Card.Subtitle className="mb-2 text-muted">
                                {university.city?.name}, {university.city?.region?.name}
                            </Card.Subtitle>
                            <Card.Text>
                                <strong>Тип:</strong> {university.type}
                                <br />
                                <strong>Средний балл ЕГЭ:</strong> {university.avgEgeScore || 'не указан'}
                                <br />
                                <strong>Рейтинг в стране:</strong> {university.countryRanking || 'не указан'}
                            </Card.Text>
                        </Col>
                        <Col md={4} className="d-flex align-items-center justify-content-end">
                            {isAuthenticated && (
                                <Button
                                    variant="outline-primary"
                                    onClick={handleAddToFavorites}
                                >
                                    ★ Добавить в избранное
                                </Button>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'faculties')}
                className="mt-4"
            >
                <Tab eventKey="faculties" title="Факультеты">
                    <Card className="mt-3">
                        <Card.Body>
                            <h5>Факультеты</h5>
                            {university.faculties && university.faculties.length > 0 ? (
                                <ListGroup>
                                    {university.faculties.map(faculty => (
                                        <ListGroup.Item key={faculty.id}>
                                            {faculty.name}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p>Нет данных о факультетах</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="specialties" title="Специальности">
                    <Card className="mt-3">
                        <Card.Body>
                            <h5>Специальности</h5>
                            {specialties && specialties.length > 0 ? (
                                <ListGroup>
                                    {specialties.map(specialty => {
                                        const subjectCombinations = specialty.subjectCombinations || [];
                                        const hasSubjects = subjectCombinations.some(
                                            comb => comb.subjects && comb.subjects.length > 0
                                        );

                                        return (
                                            <ListGroup.Item key={specialty.id}>
                                                <div className="d-flex justify-content-between">
                                                    <div>
                                                        <strong>{specialty.name}</strong>
                                                        <div>Код программы: {specialty.programCode}</div>
                                                        <div>{specialty.description}</div>

                                                        {hasSubjects && (
                                                            <div>
                                                                <strong>Требуемые предметы:</strong>
                                                                <ul>
                                                                    {subjectCombinations.flatMap(comb =>
                                                                        comb.subjects?.map((subj: SubjectResponse) => (
                                                                            <li key={subj.id}>{subj.name}</li>
                                                                        )) || []
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => navigate(`/specialty/${specialty.id}`)}
                                                    >
                                                        Подробнее
                                                    </Button>
                                                </div>
                                            </ListGroup.Item>
                                        );
                                    })}
                                </ListGroup>
                            ) : (
                                <p>Нет данных о специальностях</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default UniversityPage;