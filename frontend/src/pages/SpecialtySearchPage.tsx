import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Spinner, ListGroup, Alert, Row, Col, Badge } from 'react-bootstrap';
import { fetchAllSubjects } from '../api/subjectApi';
import { fetchSpecialtiesBySubjects } from '../api/specialtyApi';
import { SubjectResponse, SpecialtyResponse } from '../types';
import {useAuth} from "../hooks/useAuth";

const SpecialtySearchPage = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
    const [searchResults, setSearchResults] = useState<SpecialtyResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        isAuthenticated,
        addFavoriteSpecialty,
        removeFavoriteSpecialty,
        user
    } = useAuth();

    // Функция для проверки, добавлена ли специальность в избранное
    const isFavorite = (specialtyId: number) => {
        return user?.favoriteSpecialties?.includes(specialtyId) || false;
    };

    const handleFavoriteClick = (specialtyId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Предотвращаем переход по ссылке
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (isFavorite(specialtyId)) {
            removeFavoriteSpecialty(specialtyId);
        } else {
            addFavoriteSpecialty(specialtyId);
        }
    };

    useEffect(() => {
        const loadSubjects = async () => {
            setLoading(true);
            try {
                const subjectsData = await fetchAllSubjects();
                setSubjects(subjectsData);
            } catch (error) {
                setError('Не удалось загрузить список предметов');
                console.error('Ошибка загрузки предметов', error);
            } finally {
                setLoading(false);
            }
        };

        loadSubjects();
    }, []);

    const handleSubjectChange = (subjectId: number) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSearch = async () => {
        if (selectedSubjects.length === 0) {
            setError('Пожалуйста, выберите хотя бы один предмет');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const results = await fetchSpecialtiesBySubjects(selectedSubjects);
            setSearchResults(results);
        } catch (error) {
            setError('Не удалось выполнить поиск специальностей');
            console.error('Ошибка поиска специальностей', error);
        } finally {
            setLoading(false);
        }
    };

    // Функция для получения всех предметов специальности (из всех комбинаций)
    const getAllSubjectsForSpecialty = (specialty: SpecialtyResponse): SubjectResponse[] => {
        const subjectsSet = new Set<SubjectResponse>();
        specialty.subjectCombinations.forEach(comb => {
            comb.subjects.forEach(subj => {
                subjectsSet.add(subj);
            });
        });
        return Array.from(subjectsSet);
    };

    return (
        <Container className="mt-4">
            <Card className="mb-4">
                <Card.Header as="h5" className="bg-primary text-white">
                    Поиск специальностей по предметам ЕГЭ
                </Card.Header>

                <Card.Body>
                    <Card.Title>Выберите предметы, которые вы сдаете</Card.Title>

                    {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                    {/* Блок выбора предметов */}
                    <Card className="mb-4">
                        <Card.Header className="bg-light">
                            <h6>Предметы ЕГЭ</h6>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                {subjects.map(subject => (
                                    <Col md={4} key={subject.id} className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label={subject.name}
                                            checked={selectedSubjects.includes(subject.id)}
                                            onChange={() => handleSubjectChange(subject.id)}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Кнопка поиска */}
                    <div className="text-center mb-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleSearch}
                            disabled={loading || selectedSubjects.length === 0}
                        >
                            {loading ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                                    Идет поиск...
                                </>
                            ) : (
                                'Найти подходящие специальности'
                            )}
                        </Button>
                    </div>

                    {/* Результаты поиска */}
                    <Card>
                        <Card.Header className="bg-light">
                            <h5>Найденные специальности</h5>
                        </Card.Header>
                        <Card.Body>
                            {searchResults.length === 0 ? (
                                <Alert variant="info">
                                    {loading ? 'Идет поиск...' : 'Специальности не найдены. Попробуйте изменить набор предметов.'}
                                </Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {searchResults.map(specialty => (
                                        <ListGroup.Item
                                            key={specialty.id}
                                            action
                                            onClick={() => navigate(`/specialty/${specialty.id}`)}
                                            className="py-3"
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="mb-1">{specialty.name}</h5>
                                                    <div className="text-muted mb-2">
                                                        <strong>Код программы:</strong> {specialty.programCode}
                                                    </div>
                                                    <p className="mb-0">{specialty.description}</p>
                                                </div>
                                                <div>
                                                    {isAuthenticated && (
                                                        <Button
                                                            variant={isFavorite(specialty.id) ? "warning" : "outline-secondary"}
                                                            size="sm"
                                                            onClick={(e) => handleFavoriteClick(specialty.id, e)}
                                                            className="me-2"
                                                        >
                                                            {isFavorite(specialty.id) ? '★' : '☆'}
                                                        </Button>
                                                    )}
                                                    <Button variant="outline-primary" size="sm">
                                                        Подробнее
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <strong>Предметы:</strong>
                                                <div>
                                                    {getAllSubjectsForSpecialty(specialty).map(subj => (
                                                        <Badge key={subj.id} bg="info" className="me-1">
                                                            {subj.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SpecialtySearchPage;