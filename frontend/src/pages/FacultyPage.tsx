import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Spinner, Button, ListGroup, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { getFacultyById, getFacultySpecialties, fetchProgramsByFaculty } from '../api/facultyApi';
import { fetchSpecialtiesByUniversity } from '../api/specialtyApi';
import { useLocation } from 'react-router-dom';
import { FacultyResponse, SpecialtyResponse, ProgramListItemResponse, UniversityResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getUniversityById } from '../api/universityApi';

const FacultyPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [faculty, setFaculty] = useState<FacultyResponse | null>(null);
    const [specialties, setSpecialties] = useState<SpecialtyResponse[]>([]);
    const [programs, setPrograms] = useState<ProgramListItemResponse[]>([]);
    const [university, setUniversity] = useState<UniversityResponse | null>(null);
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(true);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const { isAuthenticated } = useAuth();

    const location = useLocation();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (!id) return;

                const facultyData = await getFacultyById(parseInt(id));

                let universityData: UniversityResponse | null = null;
                if (facultyData.universityId) {
                    universityData = await getUniversityById(facultyData.universityId);
                }

                const params = new URLSearchParams(location.search);
                const universityIdParam = params.get('universityId');

                let specialtiesData: SpecialtyResponse[] = [];
                if (universityIdParam) {
                    specialtiesData = await fetchSpecialtiesByUniversity(parseInt(universityIdParam), parseInt(id));
                } else {
                    specialtiesData = await getFacultySpecialties(parseInt(id));
                }

                setFaculty(facultyData);
                setUniversity(universityData);
                setSpecialties(specialtiesData);
            } catch (error) {
                console.error('Ошибка загрузки данных факультета', error);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, navigate, location.search]);

    useEffect(() => {
        if (!faculty) return;
        setLoadingPrograms(true);
        fetchProgramsByFaculty(faculty.id)
            .then(setPrograms)
            .catch(() => setPrograms([]))
            .finally(() => setLoadingPrograms(false));
    }, [faculty]);

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

    const navigateToProgram = (programId: number) => {
        const universityId = faculty.universityId || university?.id;
        if (universityId) {
            navigate(`/university/${universityId}/program/${programId}`);
        }
    };

    return (
        <Container className="mt-4">
            <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
                ← Назад
            </Button>
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <Card.Title>{(faculty as any).fullName || (faculty as any).abbreviation}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                                {university ? university.fullName : ''}
                            </Card.Subtitle>
                            <Card.Text>
                                {(faculty as any).abbreviation || 'Описание факультета отсутствует'}
                            </Card.Text>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            <Tabs activeKey={activeTab} onSelect={k => setActiveTab(k || 'info')} className="mb-4">
                <Tab eventKey="info" title="Инфо">
                    <Card>
                        <Card.Body>
                            <h5>Информация о факультете</h5>
                            <div><strong>Декан:</strong> {faculty.deanName || '—'}</div>
                            <div><strong>Контакты декана:</strong> {faculty.deanContacts || '—'}</div>
                            <div><strong>Адрес:</strong> {faculty.address || '—'}</div>
                            <div><strong>Почта:</strong> {faculty.email || '—'}</div>
                            <div><strong>Телефон:</strong> {faculty.phone || '—'}</div>
                        </Card.Body>
                    </Card>
                </Tab>
                <Tab eventKey="programs" title="Программы">
                    <Card>
                        <Card.Header as="h5">Программы факультета</Card.Header>
                        <Card.Body>
                            {loadingPrograms ? (
                                <div className="text-center"><Spinner animation="border" /></div>
                            ) : programs.length === 0 ? (
                                <p className="text-center text-muted">На факультете пока нет программ</p>
                            ) : (
                                <ListGroup variant="flush">
                                    {programs.map(prog => (
                                        <ListGroup.Item
                                            key={prog.id}
                                            action
                                            onClick={() => navigateToProgram(prog.id)}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5>{prog.specialty.name}</h5>
                                                    <div className="text-muted">Код специальности: {prog.specialty.programCode}</div>
                                                </div>
                                                <Button variant="outline-info" onClick={e => { e.stopPropagation(); navigateToProgram(prog.id); }}>Подробнее</Button>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default FacultyPage;