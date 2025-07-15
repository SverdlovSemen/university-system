import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Spinner, Button } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { UniversityResponse, SpecialtyResponse } from '../types';
import { getUniversityById } from '../api/universityApi';
import { getSpecialtyById } from '../api/specialtyApi';

const UserProfilePage = () => {
    const {
        user,
        logout,
        loading: authLoading,
        removeFavoriteUniversity,
        removeFavoriteSpecialty
    } = useAuth();
    const navigate = useNavigate();
    const [favoriteUniversities, setFavoriteUniversities] = useState<UniversityResponse[]>([]);
    const [favoriteSpecialties, setFavoriteSpecialties] = useState<SpecialtyResponse[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    // Загрузка избранных университетов
    useEffect(() => {
        if (!user || !user.favoriteUniversities) return;

        const loadUniversities = async () => {
            setLoadingFavorites(true);
            try {
                const universitiesPromises = user.favoriteUniversities.map(id =>
                    getUniversityById(id).catch(() => null)
                );

                const universitiesResults = await Promise.all(universitiesPromises);
                const validUniversities = universitiesResults.filter(
                    university => university !== null
                ) as UniversityResponse[];

                setFavoriteUniversities(validUniversities);
            } catch (error) {
                console.error('Error loading universities:', error);
            }
        };

        loadUniversities();
    }, [user]);

    // Загрузка избранных специальностей
    useEffect(() => {
        if (!user || !user.favoriteSpecialties) return;

        const loadSpecialties = async () => {
            setLoadingFavorites(true);
            try {
                // Используем try/catch для каждого запроса
                const loadedSpecialties: SpecialtyResponse[] = [];

                for (const id of user.favoriteSpecialties) {
                    try {
                        const specialty = await getSpecialtyById(id);
                        loadedSpecialties.push(specialty);
                    } catch (error) {
                        console.error(`Ошибка загрузки специальности ${id}:`, error);
                    }
                }

                setFavoriteSpecialties(loadedSpecialties);
            } catch (error) {
                console.error('Общая ошибка загрузки специальностей:', error);
            } finally {
                setLoadingFavorites(false);
            }
        };

        loadSpecialties();
    }, [user]);

    useEffect(() => {
        console.log("Загруженные специальности:", favoriteSpecialties);
    }, [favoriteSpecialties]);

    // Функция для удаления университета из избранного
    const handleRemoveUniversity = (universityId: number) => {
        removeFavoriteUniversity(universityId);
        setFavoriteUniversities(prev => prev.filter(u => u.id !== universityId));
    };

    // Функция для удаления специальности из избранного
    const handleRemoveSpecialty = (specialtyId: number) => {
        removeFavoriteSpecialty(specialtyId);
        setFavoriteSpecialties(prev => prev.filter(s => s.id !== specialtyId));
    };

    if (authLoading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
                <p className="mt-2">Загрузка профиля...</p>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container className="mt-4">
                <Card>
                    <Card.Body className="text-center">
                        <Card.Title>Профиль не найден</Card.Title>
                        <Card.Text>
                            Пожалуйста, войдите в систему, чтобы просмотреть свой профиль
                        </Card.Text>
                        <Button variant="primary" onClick={() => navigate('/login')}>
                            Войти
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Card className="mb-4">
                <Card.Header as="h5" className="bg-primary text-white">
                    Профиль пользователя
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <Card.Title>Привет, {user.username}!</Card.Title>
                            <Card.Text>
                                Это ваша личная страница, где вы можете просматривать избранные университеты и специальности.
                            </Card.Text>
                        </Col>
                        <Col md={4} className="text-end">
                            <Button variant="outline-danger" onClick={logout}>
                                Выйти
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Header as="h5" className="bg-success text-white">
                    Избранные университеты
                </Card.Header>
                <Card.Body>
                    {loadingFavorites ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">Загрузка избранных университетов...</p>
                        </div>
                    ) : favoriteUniversities.length > 0 ? (
                        <Row>
                            {favoriteUniversities.map(university => (
                                <Col key={university.id} md={6} className="mb-3">
                                    <Card>
                                        <Card.Body>
                                            <Card.Title>{university.shortName}</Card.Title>
                                            <Card.Subtitle className="mb-2 text-muted">
                                                {university.city?.name}, {university.city?.region?.name}
                                            </Card.Subtitle>
                                            <Card.Text>
                                                <strong>Тип:</strong> {university.type}
                                                <br />
                                                <strong>Средний балл:</strong> {university.avgEgeScore || 'не указан'}
                                            </Card.Text>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRemoveUniversity(university.id)}
                                            >
                                                Удалить из избранного
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <p className="text-center text-muted">
                            У вас пока нет избранных университетов. Начните добавлять их!
                        </p>
                    )}
                </Card.Body>
            </Card>

            <Card>
                <Card.Header as="h5" className="bg-info text-white">
                    Избранные специальности
                </Card.Header>
                <Card.Body>
                    {loadingFavorites ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">Загрузка избранных специальностей...</p>
                        </div>
                    ) : favoriteSpecialties.length > 0 ? (
                        <div className="list-group">
                            {favoriteSpecialties.map(specialty => (
                                <div
                                    key={specialty.id}
                                    className="list-group-item"
                                >
                                    <div className="d-flex w-100 justify-content-between">
                                        <div>
                                            <h5 className="mb-1">{specialty.name}</h5>
                                            <div className="mb-1"><small>Код: {specialty.programCode}</small></div>
                                            <p className="mb-1">{specialty.description}</p>
                                        </div>
                                        <div>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRemoveSpecialty(specialty.id)}
                                            >
                                                Удалить
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted">
                            У вас пока нет избранных специальностей. Начните добавлять их!
                        </p>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default UserProfilePage;