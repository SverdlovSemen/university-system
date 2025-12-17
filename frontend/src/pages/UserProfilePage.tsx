import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Spinner, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { UniversityResponse, ProgramResponse } from '../types';
import { getUniversityById, fetchUniversities } from '../api/universityApi';
import { getProgramById } from '../api/programApi';
import UniversityCard from '../components/UniversityCard';
import { hasActiveApplication, getMyApplications, UniversityApplicationResponse, declineOwnApplication } from '../api/universityApplicationApi';

const UserProfilePage = () => {
    const {
        user,
        logout,
        loading: authLoading,
        removeFavoriteUniversity,
        removeFavoriteProgram,
        refreshUserProfile
    } = useAuth();
    const navigate = useNavigate();
    const [favoriteUniversities, setFavoriteUniversities] = useState<UniversityResponse[]>([]);
    const [favoritePrograms, setFavoritePrograms] = useState<ProgramResponse[]>([]);
    const [allUniversities, setAllUniversities] = useState<UniversityResponse[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);
    const [applicationError, setApplicationError] = useState<string | null>(null);
    const [approvedApplication, setApprovedApplication] = useState<UniversityApplicationResponse | null>(null);

    // Загрузка одобренных заявок
    useEffect(() => {
        if (!user) return;

        const loadApprovedApplications = async () => {
            try {
                const applications = await getMyApplications();
                const approved = applications.find(app => app.statusName === 'обработано');
                setApprovedApplication(approved || null);
            } catch (error) {
                console.error('Ошибка загрузки заявок:', error);
            }
        };

        loadApprovedApplications();
    }, [user]);

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

    // Загрузка всех университетов для поиска университета программы
    useEffect(() => {
        const loadAllUniversities = async () => {
            try {
                const universities = await fetchUniversities();
                setAllUniversities(universities);
                console.log("Загружены все университеты:", universities.length);
            } catch (error) {
                console.error('Ошибка загрузки университетов:', error);
            }
        };

        loadAllUniversities();
    }, []);

    // Загрузка избранных программ и их университетов
    useEffect(() => {
        if (!user || !user.favoriteSpecialties) return;

        const loadPrograms = async () => {
            setLoadingFavorites(true);
            try {
                const loadedPrograms: ProgramResponse[] = [];

                for (const id of user.favoriteSpecialties) {
                    try {
                        const program = await getProgramById(id);
                        loadedPrograms.push(program);
                    } catch (error) {
                        console.error(`Ошибка загрузки программы ${id}:`, error);
                    }
                }

                setFavoritePrograms(loadedPrograms);
            } catch (error) {
                console.error('Общая ошибка загрузки программ:', error);
            } finally {
                setLoadingFavorites(false);
            }
        };

        loadPrograms();
    }, [user, favoriteUniversities]); // Добавляем favoriteUniversities как зависимость

    useEffect(() => {
        console.log("Загруженные программы:", favoritePrograms);
    }, [favoritePrograms]);

    // Функция для поиска университета программы по факультету
    const findUniversityByFaculty = (program: ProgramResponse): UniversityResponse | null => {
        // Поиск среди всех университетов
        for (const university of allUniversities) {
            // Поиск факультета в массиве факультетов университета
            if (university.faculties) {
                const facultyExists = university.faculties.some(faculty =>
                    faculty.id === program.faculty.id ||
                    faculty.fullName === program.faculty.fullName
                );
                if (facultyExists) {
                    return university;
                }
            }

            // Дополнительный поиск по частичному совпадению названий
            if (university.abbreviation && program.faculty.fullName.includes(university.abbreviation)) {
                return university;
            }
            if (university.fullName && program.faculty.fullName.includes(university.fullName.split(' ')[0])) {
                return university;
            }
        }

        console.warn(`Не найден университет для программы ${program.id}, факультет: ${program.faculty.fullName}`);
        return null;
    };

    // Функция для удаления университета из избранного
    const handleRemoveUniversity = async (universityId: number) => {
        try {
            await removeFavoriteUniversity(universityId);
            // После успешного удаления на сервере и обновления контекста,
            // useEffect, который следит за 'user', автоматически обновит список.
        } catch (error) {
            console.error('❌ Ошибка удаления университета из избранного:', error);
            alert('Не удалось удалить университет из избранного. Попробуйте еще раз.');
        }
    };

    // Функция для удаления программы из избранного
    const handleRemoveProgram = async (programId: number) => {
        try {
            console.log(`🗑️ Удаляем программу ${programId} из избранного`);
            await removeFavoriteProgram(programId);
            // После успешного удаления и обновления контекста,
            // useEffect, который следит за 'user', автоматически обновит список.
            console.log(`✅ Запрос на удаление программы ${programId} отправлен`);

        } catch (error) {
            console.error('❌ Ошибка удаления программы из избранного:', error);
            alert('Не удалось удалить программу из избранного. Попробуйте еще раз.');
        }
    };

    // Функция для обработки нажатия на кнопку подачи заявки
    const handleApplicationClick = async () => {
        setApplicationError(null); // Сбрасываем предыдущую ошибку
        try {
            const hasActive = await hasActiveApplication();
            if (hasActive) {
                setApplicationError('У вас уже есть активная заявка');
            } else {
                navigate('/application');
            }
        } catch (error) {
            console.error('Ошибка проверки заявки:', error);
            setApplicationError('Не удалось проверить статус заявки. Попробуйте еще раз.');
        }
    };

    // Функция для принятия роли администратора университета
    const handleBecomeUniversityAdmin = () => {
        // TODO: Реализовать логику принятия роли администратора
        console.log('Стать администратором университета');
    };

    // Функция для отклонения роли администратора университета
    const handleDeclineUniversityAdmin = async () => {
        if (!approvedApplication) return;

        try {
            // Удаляем заявку из базы данных
            await declineOwnApplication(approvedApplication.id);

            // Убираем карточку, очищая состояние
            setApprovedApplication(null);

            console.log('Заявка успешно удалена');
        } catch (error) {
            console.error('Ошибка при удалении заявки:', error);
            alert('Не удалось удалить заявку. Попробуйте еще раз.');
        }
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
                            <Card.Title>Привет, {user.firstName}!</Card.Title>
                            <Card.Text>
                                Это ваша личная страница, где вы можете просматривать избранные университеты и специальности.
                            </Card.Text>
                        </Col>
                        <Col md={4} className="d-flex align-items-center justify-content-end">
                            <Button
                                variant="success"
                                onClick={handleApplicationClick}
                            >
                                Подать заявку университета
                            </Button>
                        </Col>
                    </Row>
                    {approvedApplication && (
                        <Alert variant="success" className="mt-3">
                            <Alert.Heading>Ваша заявка университета одобрена</Alert.Heading>
                            <div className="d-flex gap-2 mt-3">
                                <Button
                                    variant="primary"
                                    onClick={handleBecomeUniversityAdmin}
                                >
                                    Стать администратором университета
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleDeclineUniversityAdmin}
                                >
                                    Отклонить
                                </Button>
                            </div>
                        </Alert>
                    )}
                    {applicationError && (
                        <Alert variant="warning" className="mt-3" onClose={() => setApplicationError(null)} dismissible>
                            {applicationError}
                        </Alert>
                    )}
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
                                <Col key={university.id} lg={6} className="mb-3">
                                    <div className="d-flex flex-column h-100">
                                        <UniversityCard university={university} />

                                    </div>
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
                    Избранные программы
                </Card.Header>
                <Card.Body>
                    {loadingFavorites ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">Загрузка избранных программ...</p>
                        </div>
                    ) : favoritePrograms.length > 0 ? (
                        <Row>
                            {favoritePrograms.map(program => (
                                <Col key={program.id} lg={6} className="mb-3">
                                    <Card className="h-100">
                                        <Card.Body>
                                            <Card.Title className="mb-1">{program.specialty.name}</Card.Title>
                                            <Card.Subtitle className="mb-2 text-muted" style={{ fontSize: '0.85rem' }}>
                                                Код: {program.specialty.programCode} • {program.specialty.educationLevel}
                                            </Card.Subtitle>
                                            <Card.Text>
                                                {(() => {
                                                    const university = findUniversityByFaculty(program);
                                                    return university ? (
                                                        <div className="mb-1">
                                                            <strong>Университет:</strong> {university.abbreviation || university.fullName}
                                                        </div>
                                                    ) : null;
                                                })()}
                                                <div className="mb-1">
                                                    <strong>Факультет:</strong> {program.faculty.fullName}
                                                </div>
                                                {program.studyForm && (
                                                    <div className="mb-1">
                                                        <strong>Форма обучения:</strong> {program.studyForm}
                                                    </div>
                                                )}
                                                {program.duration && (
                                                    <div className="mb-2">
                                                        <strong>Длительность:</strong> {program.duration} лет
                                                    </div>
                                                )}
                                            </Card.Text>
                                            <div className="d-flex justify-content-between">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        const university = findUniversityByFaculty(program);
                                                        if (university) {
                                                            navigate(`/university/${university.id}/program/${program.id}`);
                                                        } else {
                                                            console.error('Не удалось найти университет для программы:', program);
                                                            alert('Не удалось найти университет для этой программы');
                                                        }
                                                    }}
                                                >
                                                    Подробнее
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveProgram(program.id)}
                                                >
                                                    Удалить из избранного
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <p className="text-center text-muted">
                            У вас пока нет избранных программ. Начните добавлять их!
                        </p>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default UserProfilePage;

