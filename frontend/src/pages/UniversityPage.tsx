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

                const universityData = await getUniversityById(parseInt(id));
                const allSpecialtiesData = await fetchSpecialtiesByUniversity(parseInt(id));

                if (isMounted) {
                    setUniversity(universityData);
                    setAllSpecialties(allSpecialtiesData);
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

    const handleFacultyDetails = async (facultyId: number) => {
        // Ensure specialties for faculty are loaded
        let specs = facultySpecialties[facultyId];
        try {
            if (!specs) {
                setLoadingFacultySpecialties(facultyId);
                specs = await fetchSpecialtiesByUniversity(university?.id || 0, facultyId);
                setFacultySpecialties(prev => ({ ...prev, [facultyId]: specs }));
            }
            if (specs && specs.length > 0) {
                const first = specs[0];
                navigate(`/university/${university?.id}/program/${first.id}?combinationId=null`);
            } else {
                // Fallback: navigate to faculty page which lists specialties
                navigate(`/faculty/${facultyId}?universityId=${university?.id}`);
            }
        } catch (err) {
            console.error('Ошибка при переходе к программе факультета', err);
            navigate(`/faculty/${facultyId}?universityId=${university?.id}`);
        } finally {
            setLoadingFacultySpecialties(null);
        }
    };

    useEffect(() => {
        if (!university?.faculties) return;
        university.faculties.forEach(f => loadFacultySpecialties(f.id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [university]);

    const isFavoriteSpecialty = (specialtyId: number) => {
        return user?.favoriteSpecialties?.includes(specialtyId) || false;
    };

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

    const buildProgramsFromSpecialties = (specialties: SpecialtyResponse[]) => {
        type ProgramItem = {
            specialtyId: number;
            specialtyName: string;
            programCode: string;
            description?: string;
            combinationId: number | null;
            subjects: SubjectResponse[];
        };

        const programs: ProgramItem[] = [];
        specialties.forEach(s => {
            if (s.subjectCombinations && s.subjectCombinations.length > 0) {
                s.subjectCombinations.forEach(comb => {
                    programs.push({
                        specialtyId: s.id,
                        specialtyName: s.name,
                        programCode: s.programCode,
                        description: s.description,
                        combinationId: comb.id,
                        subjects: comb.subjects || []
                    });
                });
            } else {
                programs.push({
                    specialtyId: s.id,
                    specialtyName: s.name,
                    programCode: s.programCode,
                    description: s.description,
                    combinationId: null,
                    subjects: []
                });
            }
        });
        return programs;
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
            <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">Назад к результатам</Button>

            <Card>
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <Card.Title>{university.abbreviation || university.fullName}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>{university.fullName}</Card.Subtitle>
                            <Card.Subtitle className="mb-2 text-muted">{university.city?.name}, { (university.city as any)?.region?.name}</Card.Subtitle>
                            <Card.Text>
                                <strong>Тип:</strong> {university.type || (university as any).ownershipType}
                                <br />
                                <strong>Средний балл ЕГЭ:</strong> {(university as any).avgEgeScore ?? 'не указан'}
                                <br />
                                <strong>Рейтинг в стране:</strong> {(university as any).countryRanking ?? 'не указан'}
                            </Card.Text>
                        </Col>
                        <Col md={4} className="d-flex align-items-center justify-content-end">
                            {isAuthenticated && (
                                <Button variant={isFavoriteUniversity ? "warning" : "outline-primary"} onClick={handleAddToFavorites}>
                                    {isFavoriteUniversity ? '★ В избранном' : '☆ Добавить в избранное'}
                                </Button>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

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
                                <strong>Город:</strong> {university.city?.name}, {(university.city as any)?.region?.name}
                                <br />
                                <strong>Сайт:</strong> {(university as any).website || 'не указан'}
                                <br />
                                <strong>Статус:</strong> {(university as any).status || 'не указан'}
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
                                                    <div className="text-muted small">{(faculty as any).description || 'Описание факультета отсутствует'}</div>
                                                    {(faculty as any).deanName && <div className="small mt-1">Декан: {(faculty as any).deanName}</div>}
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
                            {allSpecialties.length > 0 ? (
                                (() => {
                                    const programs = buildProgramsFromSpecialties(allSpecialties);
                                    return programs.length > 0 ? (
                                        <ListGroup>
                                            {programs.map((prog, idx) => (
                                                <ListGroup.Item
                                                    key={`${prog.specialtyId}-${prog.combinationId ?? 'none'}-${idx}`}
                                                    action
                                                    onClick={() => navigate(`/university/${university.id}/program/${prog.specialtyId}?combinationId=${prog.combinationId}`)}
                                                >
                                                    <div className="d-flex justify-content-between">
                                                        <div>
                                                            <strong>{prog.specialtyName}</strong>
                                                            <div>Код программы: {prog.programCode}</div>
                                                            <div>{prog.description}</div>
                                                            {prog.subjects && prog.subjects.length > 0 && (
                                                                <div>
                                                                    <strong>Требуемые предметы:</strong>
                                                                    <ul>
                                                                        {prog.subjects.map((subj: SubjectResponse) => (
                                                                            <li key={subj.id}>{subj.name}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            {isAuthenticated && (
                                                                <Button variant={isFavoriteSpecialty(prog.specialtyId) ? "warning" : "outline-secondary"} size="sm" className="me-2" onClick={(e) => { e.stopPropagation(); handleSpecialtyFavorite(prog.specialtyId, e); }}>
                                                                    {isFavoriteSpecialty(prog.specialtyId) ? '★' : '☆'}
                                                                </Button>
                                                            )}
                                                            <Button variant="outline-info" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/university/${university.id}/program/${prog.specialtyId}?combinationId=${prog.combinationId}`); }}>
                                                                Подробнее
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <p>Нет данных о программах</p>
                                    );
                                })()
                            ) : (
                                <p>Нет данных о программах</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default UniversityPage;