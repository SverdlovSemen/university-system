import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Card, Button, Spinner, Row, Col,
    ListGroup, Tab, Tabs
} from 'react-bootstrap';
import { getUniversityById } from '../api/universityApi';
import { fetchSpecialtiesByUniversity } from '../api/specialtyApi';
import { UniversityResponse, SpecialtyResponse, SubjectResponse } from '../types';
import { useAuth } from '../hooks/useAuth';

const UniversityPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [university, setUniversity] = useState<UniversityResponse | null>(null);
    const [allSpecialties, setAllSpecialties] = useState<SpecialtyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('faculties');

    // Состояния для работы с факультетами и специальностями
    const [activeFacultyId, setActiveFacultyId] = useState<number | null>(null);
    const [facultySpecialties, setFacultySpecialties] = useState<Record<number, SpecialtyResponse[]>>({});
    const [loadingFacultySpecialties, setLoadingFacultySpecialties] = useState<number | null>(null);

    const {
        isAuthenticated,
        addFavoriteUniversity,
        removeFavoriteUniversity,
        addFavoriteSpecialty,
        removeFavoriteSpecialty,
        user
    } = useAuth();
    const [isFavoriteUniversity, setIsFavoriteUniversity] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                if (!id) return;

                // Загружаем данные университета
                const universityData = await getUniversityById(parseInt(id));

                // Загружаем ВСЕ специальности университета
                const allSpecialtiesData = await fetchSpecialtiesByUniversity(parseInt(id));

                if (isMounted) {
                    setUniversity(universityData);
                    setAllSpecialties(allSpecialtiesData);
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

    useEffect(() => {
        if (user && user.favoriteUniversities && university) {
            setIsFavoriteUniversity(user.favoriteUniversities.includes(university.id));
        }
    }, [user, university]);

    const handleAddToFavorites = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!university) return;

        if (isFavoriteUniversity) {
            removeFavoriteUniversity(university.id);
        } else {
            addFavoriteUniversity(university.id);
        }
        setIsFavoriteUniversity(!isFavoriteUniversity);
    };

    // Загрузка специальностей для факультета
    const loadFacultySpecialties = async (facultyId: number) => {
        if (facultySpecialties[facultyId]) return;

        setLoadingFacultySpecialties(facultyId);
        try {
            const specialties = await fetchSpecialtiesByUniversity(
                university?.id || 0,
                facultyId
            );
            setFacultySpecialties(prev => ({
                ...prev,
                [facultyId]: specialties
            }));
        } catch (error) {
            console.error(`Ошибка загрузки специальностей для факультета ${facultyId}`, error);
        } finally {
            setLoadingFacultySpecialties(null);
        }
    };

    // Переключение активного факультета
    const toggleFaculty = (facultyId: number) => {
        if (activeFacultyId === facultyId) {
            setActiveFacultyId(null);
        } else {
            setActiveFacultyId(facultyId);
            loadFacultySpecialties(facultyId);
        }
    };

    // Функция для проверки, добавлена ли специальность в избранное
    const isFavoriteSpecialty = (specialtyId: number) => {
        return user?.favoriteSpecialties?.includes(specialtyId) || false;
    };

    // Обработчик клика по кнопке избранного для специальности
    const handleSpecialtyFavorite = (specialtyId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (isFavoriteSpecialty(specialtyId)) {
            removeFavoriteSpecialty(specialtyId);
        } else {
            addFavoriteSpecialty(specialtyId);
        }
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
                                    variant={isFavoriteUniversity ? "warning" : "outline-primary"}
                                    onClick={handleAddToFavorites}
                                >
                                    {isFavoriteUniversity ? '★ В избранном' : '☆ Добавить в избранное'}
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
                                        <ListGroup.Item
                                            key={faculty.id}
                                            action
                                            onClick={() => toggleFaculty(faculty.id)}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>{faculty.name}</strong>
                                                </div>
                                                <div>
                                                    {activeFacultyId === faculty.id ? '▲' : '▼'}
                                                </div>
                                            </div>

                                            {activeFacultyId === faculty.id && (
                                                <div className="mt-3">
                                                    {loadingFacultySpecialties === faculty.id ? (
                                                        <div className="text-center">
                                                            <Spinner size="sm" animation="border" />
                                                            <p>Загрузка специальностей...</p>
                                                        </div>
                                                    ) : (
                                                        facultySpecialties[faculty.id]?.length > 0 ? (
                                                            <ListGroup variant="flush">
                                                                {facultySpecialties[faculty.id].map(specialty => (
                                                                    <ListGroup.Item
                                                                        key={specialty.id}
                                                                        action
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/specialty/${specialty.id}`);
                                                                        }}
                                                                    >
                                                                        <div className="d-flex justify-content-between align-items-center">
                                                                            <div>
                                                                                <h6>{specialty.name}</h6>
                                                                                <div className="text-muted small">
                                                                                    Код: {specialty.programCode}
                                                                                </div>
                                                                                <p className="mb-0 small">{specialty.description}</p>
                                                                            </div>
                                                                            <div>
                                                                                {isAuthenticated && (
                                                                                    <Button
                                                                                        variant={isFavoriteSpecialty(specialty.id) ? "warning" : "outline-secondary"}
                                                                                        size="sm"
                                                                                        className="me-2"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleSpecialtyFavorite(specialty.id, e);
                                                                                        }}
                                                                                    >
                                                                                        {isFavoriteSpecialty(specialty.id) ? '★' : '☆'}
                                                                                    </Button>
                                                                                )}
                                                                                <Button
                                                                                    variant="outline-info"
                                                                                    size="sm"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        navigate(`/specialty/${specialty.id}`);
                                                                                    }}
                                                                                >
                                                                                    Подробнее
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </ListGroup.Item>
                                                                ))}
                                                            </ListGroup>
                                                        ) : (
                                                            <p className="text-center text-muted mt-3">
                                                                На факультете пока нет специальностей
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p>Нет данных о факультетах</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="specialties" title="Все специальности">
                    <Card className="mt-3">
                        <Card.Body>
                            <h5>Все специальности университета</h5>
                            {allSpecialties.length > 0 ? (
                                <ListGroup>
                                    {allSpecialties.map(specialty => {
                                        const subjectCombinations = specialty.subjectCombinations || [];
                                        const hasSubjects = subjectCombinations.some(
                                            comb => comb.subjects && comb.subjects.length > 0
                                        );

                                        return (
                                            <ListGroup.Item
                                                key={specialty.id}
                                                action
                                                onClick={() => navigate(`/specialty/${specialty.id}`)}
                                            >
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
                                                    <div>
                                                        {isAuthenticated && (
                                                            <Button
                                                                variant={isFavoriteSpecialty(specialty.id) ? "warning" : "outline-secondary"}
                                                                size="sm"
                                                                className="me-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSpecialtyFavorite(specialty.id, e);
                                                                }}
                                                            >
                                                                {isFavoriteSpecialty(specialty.id) ? '★' : '☆'}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/specialty/${specialty.id}`);
                                                            }}
                                                        >
                                                            Подробнее
                                                        </Button>
                                                    </div>
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