import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Spinner, Button, Alert, Badge, Row, Col } from 'react-bootstrap';
import { getSpecialtyById } from '../api/specialtyApi';
import { fetchUniversitiesBySpecialty } from '../api/universityApi';
import { SpecialtyResponse, UniversityResponse, SubjectResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import UniversityCard from '../components/UniversityCard';


const SpecialtyPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [specialty, setSpecialty] = useState<SpecialtyResponse | null>(null);
    const [universities, setUniversities] = useState<UniversityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        isAuthenticated,
        user
    } = useAuth();
    // Убираем функционал избранных специальностей - добавлять в избранное можно только университеты и программы

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!id) throw new Error("Specialty ID is missing");

                const specialtyData = await getSpecialtyById(parseInt(id));
                const universitiesData = await fetchUniversitiesBySpecialty(parseInt(id));

                if (isMounted) {
                    setSpecialty(specialtyData);
                    setUniversities(universitiesData);
                }
            } catch (error) {
                if (isMounted) {
                    setError('Не удалось загрузить данные о специальности');
                    console.error('Ошибка загрузки данных', error);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [id, navigate]);

    // Функция для получения всех предметов специальности (из всех комбинаций)
    const getAllSubjects = (): SubjectResponse[] => {
        if (!specialty) return [];

        const subjectsSet = new Set<SubjectResponse>();
        specialty.subjectCombinations.forEach(comb => {
            comb.subjects.forEach(subj => {
                subjectsSet.add(subj);
            });
        });
        return Array.from(subjectsSet);
    };

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
                <p>Загрузка информации о специальности...</p>
            </Container>
        );
    }

    if (error || !specialty) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    <h2>Специальность не найдена</h2>
                    <p>{error || 'Запрашиваемая специальность не существует или была удалена'}</p>
                </Alert>
                <Button variant="primary" onClick={() => navigate('/')}>
                    Вернуться на главную
                </Button>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Button
                variant="outline-secondary"
                onClick={() => navigate(-1)}
                className="mb-3"
            >
                ← Назад к результатам поиска
            </Button>

            <Card className="mb-4 border-primary">
                <Card.Header className="bg-primary text-white">
                    <Card.Title className="mb-0">{specialty.name}</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <div className="mb-3">
                                <h5>Информация о специальности</h5>
                                <p><strong>Код программы:</strong> {specialty.programCode}</p>
                                <p>{specialty.description}</p>
                            </div>

                            <div className="mb-3">
                                <h5>Требуемые предметы ЕГЭ</h5>
                                <div className="d-flex flex-wrap gap-2">
                                    {getAllSubjects().map(subj => (
                                        <Badge key={subj.id} bg="info" className="fs-6 py-2">
                                            {subj.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </Col>

                    </Row>
                </Card.Body>
            </Card>

            <Card className="border-success">
                <Card.Header className="bg-success text-white">
                    <h5 className="mb-0">Университеты с этой специальностью</h5>
                </Card.Header>
                <Card.Body>
                    {universities.length === 0 ? (
                        <Alert variant="info">
                            Нет университетов, предлагающих эту специальность
                        </Alert>
                    ) : (
                        <Row>
                            {universities.map(university => (
                                <Col key={university.id} md={6} lg={4} className="mb-3">
                                    <UniversityCard university={university} />
                                </Col>
                            ))}
                        </Row>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SpecialtyPage;