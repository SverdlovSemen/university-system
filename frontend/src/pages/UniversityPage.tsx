import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Card, Button, Spinner, Row, Col,
    ListGroup, Tab, Tabs
} from 'react-bootstrap';
import { getUniversityById } from '../api/universityApi';
import { fetchProgramsByUniversity, ProgramListItemResponse } from '../api/programApi';
import {UniversityResponse, ProgramResponse, SpecialtyResponse, InfrastructureResponse} from '../types';
import { useAuth } from '../hooks/useAuth';
import {fetchSpecialtiesByUniversity} from "../api/specialtyApi";
import UniversityCard from '../components/UniversityCard';
import { fetchInfrastructureByUniversity } from '../api/infrastructureApi';

const UniversityPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [university, setUniversity] = useState<UniversityResponse | null>(null);
    const [allPrograms, setAllPrograms] = useState<ProgramListItemResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('faculties');

    const [facultySpecialties, setFacultySpecialties] = useState<Record<number, SpecialtyResponse[]>>({});
    const [loadingFacultySpecialties, setLoadingFacultySpecialties] = useState<number | null>(null);
    const [isFavoriteUniversity, setIsFavoriteUniversity] = useState(false);
    const [infrastructure, setInfrastructure] = useState<InfrastructureResponse[]>([]);
    const [infrastructureLoading, setInfrastructureLoading] = useState(false);
    const [infrastructureError, setInfrastructureError] = useState<string | null>(null);

    const {
        isAuthenticated,
        addFavoriteUniversity,
        removeFavoriteUniversity,
        addFavoriteProgram,
        removeFavoriteProgram,
        user
    } = useAuth();

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                if (!id) return;

                const universityData = await getUniversityById(parseInt(id));
                const allProgramsData = await fetchProgramsByUniversity(parseInt(id));

                if (isMounted) {
                    setUniversity(universityData);
                    setAllPrograms(allProgramsData);
                }
            } catch (error) {
                console.error('Ошибка загрузки данных', error);
                navigate('/');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [id, navigate]);

    useEffect(() => {
        if (!id) return;
        let isMounted = true;
        const loadInfrastructure = async () => {
            setInfrastructureLoading(true);
            try {
                const infraData = await fetchInfrastructureByUniversity(parseInt(id));
                if (isMounted) {
                    setInfrastructure(infraData);
                    setInfrastructureError(null);
                }
            } catch (error) {
                console.error('Ошибка загрузки инфраструктуры', error);
                if (isMounted) setInfrastructureError('Не удалось загрузить инфраструктуру');
            } finally {
                if (isMounted) setInfrastructureLoading(false);
            }
        };
        loadInfrastructure();
        return () => { isMounted = false; };
    }, [id]);

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

    const loadFacultySpecialties = async (facultyId: number) => {
        if (facultySpecialties[facultyId]) return;
        setLoadingFacultySpecialties(facultyId);
        try {
            const specialties = await fetchSpecialtiesByUniversity(university?.id || 0, facultyId);
            setFacultySpecialties(prev => ({ ...prev, [facultyId]: specialties }));
        } catch (error) {
            console.error(`Ошибка загрузки специальностей для факультета ${facultyId}`, error);
        } finally {
            setLoadingFacultySpecialties(null);
        }
    };

    const handleFacultyDetails = (facultyId: number) => {
        navigate(`/faculty/${facultyId}?universityId=${university?.id}`);
    };

    useEffect(() => {
        if (!university?.faculties) return;
        university.faculties.forEach(f => loadFacultySpecialties(f.id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [university]);

    const isFavoriteProgram = (programId: number) => {
        return user?.favoriteSpecialties?.includes(programId) || false;
    };

    const handleProgramFavorite = async (programId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            if (isFavoriteProgram(programId)) {
                await removeFavoriteProgram(programId);
            } else {
                await addFavoriteProgram(programId);
            }
            // После обновления в AuthContext, isFavoriteProgram() будет возвращать актуальное значение
        } catch (error) {
            console.error('❌ Ошибка обновления избранной программы:', error);
        }
    };

    const goToProgram = (programId: number) => {
        if (!university) return;
        navigate(`/university/${university.id}/program/${programId}`);
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
            <div className="mb-4">
                {university && <UniversityCard university={university} hideDetailsButton />}
            </div>
            <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">Назад к результатам</Button>



            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'faculties')} className="mt-4">
                <Tab eventKey="info" title="Инфо">
                    <Card className="mt-3">
                        <Card.Body>
                            <h5>О университете</h5>
                            <p>{university.fullName}</p>
                            <div className="mt-3">
                                <strong>Короткое имя:</strong> {university.abbreviation || ''}
                                <br />
                                <strong>Тип:</strong> {university.type || (university as any).ownershipType || ''}
                                <br />
                                <strong>Город:</strong> {university.city?.name || 'не указан'}
                                <br />
                                <strong>Регион:</strong> {(university.city as any)?.region?.name || 'не указан'}
                                <br />
                                <strong>Год основания:</strong> {university.foundedYear || 'не указан'}
                                <br />
                                <strong>Сайт:</strong> {(university as any).website || 'не указан'}
                                <br />
                                <strong>Номер аккредитации:</strong> {(university as any).accreditationNumber || 'не указан'}
                                <br />
                                <strong>Телефон администрации:</strong> {(university as any).adminPhone || 'не указан'}
                                <br />
                                <strong>Почта администрации:</strong> {(university as any).adminEmail || 'не указана'}
                            </div>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="faculties" title="Факультеты">
                    <Card className="mt-3">
                        <Card.Body>
                            <h5>Факультеты</h5>
                            {university.faculties && university.faculties.length > 0 ? (
                                <ListGroup>
                                    {university.faculties.map(faculty => (
                                        <ListGroup.Item key={faculty.id}>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <strong>{(faculty as any).name || (faculty as any).fullName || (faculty as any).abbreviation}</strong>
                                                </div>
                                                <div className="d-flex align-items-start">
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => handleFacultyDetails(faculty.id)}
                                                    >
                                                        Подробнее
                                                    </Button>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p>Нет данных о факультетах</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="specialties" title="Все программы">
                    <Card className="mt-3">
                        <Card.Body>
                            <h5>Все программы университета</h5>
                            {allPrograms.length > 0 ? (
                                <ListGroup>
                                    {allPrograms.map((prog, idx) => (
                                        <ListGroup.Item
                                            key={prog.id}
                                            action
                                            onClick={() => goToProgram(prog.id)}
                                        >
                                            <div className="d-flex justify-content-between">
                                                <div>
                                                    <strong>{prog.specialty.name}</strong>
                                                    <div>Код специальности: {prog.specialty.programCode}</div>
                                                    <div>Факультет: {prog.faculty.fullName || prog.faculty.abbreviation}</div>
                                                </div>
                                                <div>
                                                    {isAuthenticated && (
                                                        <Button variant={isFavoriteProgram(prog.id) ? "warning" : "outline-secondary"} size="sm" className="me-2" onClick={(e) => { e.stopPropagation(); handleProgramFavorite(prog.id, e); }}>
                                                            {isFavoriteProgram(prog.id) ? '★' : '☆'}
                                                        </Button>
                                                    )}
                                                    <Button variant="outline-info" size="sm" onClick={(e) => { e.stopPropagation(); goToProgram(prog.id); }}>
                                                        Подробнее
                                                    </Button>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p>Нет данных о программах</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="infrastructure" title="Инфраструктура">
                    <Card className="mt-3">
                        <Card.Body>
                            <h5>Инфраструктура университета</h5>
                            {infrastructureLoading ? (
                                <div className="text-center my-3">
                                    <Spinner animation="border" />
                                </div>
                            ) : infrastructureError ? (
                                <p className="text-danger">{infrastructureError}</p>
                            ) : infrastructure.length > 0 ? (
                                <ListGroup>
                                    {infrastructure.map((item) => (
                                        <ListGroup.Item key={item.id}>
                                            <div className="d-flex flex-column flex-md-row justify-content-between">
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    {item.type?.name && (
                                                        <div>Тип: {item.type.name}</div>
                                                    )}
                                                    {item.type?.description && (
                                                        <div className="text-muted small">{item.type.description}</div>
                                                    )}
                                                </div>
                                                <div className="mt-2 mt-md-0 text-md-end">
                                                    {item.address && (
                                                        <div><strong>Адрес:</strong> {item.address}</div>
                                                    )}
                                                </div>
                                            </div>
                                            {item.description && (
                                                <div className="mt-2">{item.description}</div>
                                            )}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p>Нет данных об инфраструктуре</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default UniversityPage;