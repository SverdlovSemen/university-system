import React, { useState, useEffect, useContext } from 'react';
import { Container, Tab, Tabs, Card, Form, Row, Col, Spinner, Alert, Button, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUniversityById, updateUniversity } from '../api/universityApi';
import { fetchAllCities } from '../api/cityApi';
import { getFacultiesByUniversity } from '../api/facultyApi';
import { fetchProgramDetailsByUniversity } from '../api/programApi';
import { UniversityResponse, CityResponse, UniversityRequest, FacultyResponse, ProgramResponse } from '../types';



const UniversityAdminPage = () => {
    const [activeTab, setActiveTab] = useState('info');
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const [university, setUniversity] = useState<UniversityResponse | null>(null);
    const [cities, setCities] = useState<CityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Состояния для факультетов
    const [faculties, setFaculties] = useState<FacultyResponse[]>([]);
    const [facultiesLoading, setFacultiesLoading] = useState(false);
    const [facultiesError, setFacultiesError] = useState<string | null>(null);

    // Состояния для программ
    const [programs, setPrograms] = useState<ProgramResponse[]>([]);
    const [programsLoading, setProgramsLoading] = useState(false);
    const [programsError, setProgramsError] = useState<string | null>(null);



    // Состояния для редактируемых полей
    const [formData, setFormData] = useState({
        fullName: '',
        abbreviation: '',
        type: '',
        ownershipType: '',
        cityId: 0,
        foundedYear: '',
        website: '',
        adminEmail: '',
        adminPhone: '',
        accreditationNumber: ''
    });

    // Загружаем данные университета и городов при монтировании компонента
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const universityId = user?.universityIds?.[0];

                if (!universityId) {
                    setError('У вас нет назначенного университета');
                    setLoading(false);
                    return;
                }

                // Загружаем университет и города параллельно
                const [universityData, citiesData] = await Promise.all([
                    getUniversityById(universityId),
                    fetchAllCities()
                ]);

                setUniversity(universityData);
                setCities(citiesData);

                // Инициализируем форму данными университета
                setFormData({
                    fullName: universityData.fullName || '',
                    abbreviation: universityData.abbreviation || '',
                    type: universityData.type || '',
                    ownershipType: universityData.ownershipType || '',
                    cityId: universityData.city?.id || 0,
                    foundedYear: universityData.foundedYear?.toString() || '',
                    website: universityData.website || '',
                    adminEmail: universityData.adminEmail || '',
                    adminPhone: universityData.adminPhone || '',
                    accreditationNumber: universityData.accreditationNumber || ''
                });

            } catch (err) {
                console.error('Ошибка загрузки данных:', err);
                setError('Не удалось загрузить информацию об университете');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadData();
        }
    }, [user]);

    // Загружаем факультеты при переключении на вкладку "Факультеты"
    useEffect(() => {
        const loadFaculties = async () => {
            if (activeTab === 'faculties' && university?.id) {
                try {
                    setFacultiesLoading(true);
                    setFacultiesError(null);
                    const facultiesData = await getFacultiesByUniversity(university.id);
                    setFaculties(facultiesData);
                } catch (err) {
                    console.error('Ошибка загрузки факультетов:', err);
                    setFacultiesError('Не удалось загрузить список факультетов');
                } finally {
                    setFacultiesLoading(false);
                }
            }
        };

        loadFaculties();
    }, [activeTab, university?.id]);

    // Загружаем программы при переключении на вкладку "Программы"
    useEffect(() => {
        const loadPrograms = async () => {
            if (activeTab === 'programs' && university?.id) {
                try {
                    setProgramsLoading(true);
                    setProgramsError(null);
                    const programsData = await fetchProgramDetailsByUniversity(university.id);
                    setPrograms(programsData);
                } catch (err) {
                    console.error('Ошибка загрузки программ:', err);
                    setProgramsError('Не удалось загрузить список программ');
                } finally {
                    setProgramsLoading(false);
                }
            }
        };

        loadPrograms();
    }, [activeTab, university?.id]);



    // Обработчик изменения полей формы
    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Сбрасываем сообщения при изменении данных
        setSaveError(null);
        setSaveSuccess(false);
    };

    // Обработчик обновления университета
    const handleUpdate = async () => {
        if (!university?.id) {
            setSaveError('ID университета отсутствует');
            return;
        }

        // Валидация обязательных полей
        if (!formData.fullName.trim()) {
            setSaveError('Полное название университета обязательно для заполнения');
            return;
        }

        if (!formData.abbreviation.trim()) {
            setSaveError('Аббревиатура университета обязательна для заполнения');
            return;
        }

        if (!formData.type.trim()) {
            setSaveError('Тип университета обязателен для заполнения');
            return;
        }

        if (!formData.cityId || formData.cityId === 0) {
            setSaveError('Необходимо выбрать город');
            return;
        }

        try {
            setSaving(true);
            setSaveError(null);
            setSaveSuccess(false);

            // Логируем данные для отладки
            console.log('Текущий пользователь:', user);
            console.log('ID университета для обновления:', university.id);
            console.log('Роли пользователя:', user?.roles);
            console.log('ID университетов пользователя:', user?.universityIds);

            // Подготавливаем данные для отправки
            const updateRequest: UniversityRequest = {
                id: university.id,
                fullName: formData.fullName.trim(),
                abbreviation: formData.abbreviation.trim(),
                type: formData.type.trim(),
                ownershipType: formData.ownershipType.trim() || undefined,
                cityId: formData.cityId,
                foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
                website: formData.website.trim() || undefined,
                adminEmail: formData.adminEmail.trim() || undefined,
                adminPhone: formData.adminPhone.trim() || undefined,
                accreditationNumber: formData.accreditationNumber.trim() || undefined
            };

            console.log('Отправляемые данные:', updateRequest);

            // Отправляем запрос на обновление
            await updateUniversity(university.id, updateRequest);

            // Перезагружаем данные университета
            const updatedUniversity = await getUniversityById(university.id);
            setUniversity(updatedUniversity);

            setSaveSuccess(true);

            // Автоматически скрываем сообщение об успехе через 3 секунды
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);

        } catch (err: any) {
            console.error('Ошибка обновления университета:', err);
            console.error('Детали ошибки:', err.response);

            let errorMessage = 'Не удалось обновить данные университета';

            if (err.response?.status === 403) {
                errorMessage = 'Доступ запрещен. У вас недостаточно прав для редактирования этого университета. ' +
                    'Убедитесь, что вы являетесь сотрудником этого университета.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data) {
                errorMessage = typeof err.response.data === 'string'
                    ? err.response.data
                    : JSON.stringify(err.response.data);
            } else if (err.message) {
                errorMessage = err.message;
            }

            setSaveError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container className="mt-4">
                <h2 className="mb-4">Панель администратора университета</h2>

            <Tabs
                id="university-admin-tabs"
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'info')}
                className="mb-3"
            >
                {/* Вкладка: Основная информация об университете  */}
                <Tab eventKey="info" title="Основная информация">
                    <Card>
                        <Card.Header as="h5">Информация об университете</Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Загрузка...</span>
                                    </Spinner>
                                </div>
                            ) : error ? (
                                <Alert variant="danger">{error}</Alert>
                            ) : university ? (
                                <Form>
                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label><strong>Полное название</strong></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.fullName}
                                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                                    placeholder="Введите полное название университета"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Аббревиатура</strong></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.abbreviation}
                                                    onChange={(e) => handleInputChange('abbreviation', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Тип</strong></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.type}
                                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Тип собственности</strong></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.ownershipType}
                                                    onChange={(e) => handleInputChange('ownershipType', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Город</strong></Form.Label>
                                                <Form.Select
                                                    value={formData.cityId}
                                                    onChange={(e) => handleInputChange('cityId', parseInt(e.target.value))}
                                                >
                                                    <option value={0}>Выберите город</option>
                                                    {cities.map(city => (
                                                        <option key={city.id} value={city.id}>
                                                            {city.name}, {city.region.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Год основания</strong></Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={formData.foundedYear}
                                                    onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                                                    min="1000"
                                                    max={new Date().getFullYear()}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Сайт</strong></Form.Label>
                                                <Form.Control
                                                    type="url"
                                                    value={formData.website}
                                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                                    placeholder="https://example.com"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Почта администрации</strong></Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    value={formData.adminEmail}
                                                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                                                    placeholder="admin@university.com"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Телефон администрации</strong></Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    value={formData.adminPhone}
                                                    onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                                                    placeholder="+7 (999) 999-99-99"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label><strong>Номер аккредитации</strong></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.accreditationNumber}
                                                    onChange={(e) => handleInputChange('accreditationNumber', e.target.value)}
                                                    placeholder="Введите номер аккредитации"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Показываем сообщения об ошибке или успехе */}
                                    {saveError && (
                                        <Alert variant="danger" className="mb-3">
                                            {saveError}
                                        </Alert>
                                    )}
                                    {saveSuccess && (
                                        <Alert variant="success" className="mb-3">
                                            Данные университета успешно обновлены!
                                        </Alert>
                                    )}

                                    {/* Кнопка обновления */}
                                    <Row>
                                        <Col>
                                            <Button
                                                variant="primary"
                                                onClick={handleUpdate}
                                                disabled={saving}
                                                className="mt-3"
                                            >
                                                {saving ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            role="status"
                                                            aria-hidden="true"
                                                            className="me-2"
                                                        />
                                                        Обновление...
                                                    </>
                                                ) : (
                                                    'Обновить данные'
                                                )}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            ) : (
                                <Alert variant="info">Данные университета отсутствуют</Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                {/* Вкладка: Факультеты */}
                <Tab eventKey="faculties" title="Факультеты">
                    <Card>
                        <Card.Header as="h5">Управление факультетами</Card.Header>
                        <Card.Body>
                            {facultiesLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Загрузка...</span>
                                    </Spinner>
                                </div>
                            ) : facultiesError ? (
                                <Alert variant="danger">{facultiesError}</Alert>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <Button
                                            variant="success"
                                            onClick={() => navigate('/faculty/new')}
                                        >
                                            Добавить факультет
                                        </Button>
                                    </div>

                                    {faculties.length === 0 ? (
                                        <Alert variant="info">
                                            В университете пока нет факультетов.
                                        </Alert>
                                    ) : (
                                        <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Полное название</th>
                                                <th>Аббревиатура</th>
                                                <th>Декан</th>
                                                <th>Email</th>
                                                <th>Телефон</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {faculties.map((faculty, index) => (
                                                <tr key={faculty.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{faculty.fullName}</td>
                                                    <td>{faculty.abbreviation || '—'}</td>
                                                    <td>{faculty.deanName || '—'}</td>
                                                    <td>{faculty.email || '—'}</td>
                                                    <td>{faculty.phone || '—'}</td>
                                                    <td>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => navigate(`/faculty/edit/${faculty.id}`)}
                                                        >
                                                            Редактировать
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                {/* Вкладка: Программы */}
                <Tab eventKey="programs" title="Программы">
                    <Card>
                        <Card.Header as="h5">Управление программами обучения</Card.Header>
                        <Card.Body>
                            {programsLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Загрузка...</span>
                                    </Spinner>
                                </div>
                            ) : programsError ? (
                                <Alert variant="danger">{programsError}</Alert>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <Button
                                            variant="success"
                                            onClick={() => navigate('/program/new')}
                                        >
                                            Добавить программу
                                        </Button>
                                    </div>

                                    {programs.length === 0 ? (
                                        <Alert variant="info">
                                            В университете пока нет программ обучения.
                                        </Alert>
                                    ) : (
                                        <Table striped bordered hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Факультет</th>
                                                    <th>Специальность</th>
                                                    <th>Код</th>
                                                    <th>Уровень образования</th>
                                                    <th>Форма обучения</th>
                                                    <th>Продолжительность</th>
                                                    <th>Язык обучения</th>
                                                    <th>Мобильность</th>
                                                    <th>Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {programs.map((program, index) => (
                                                    <tr key={program.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{program.faculty.fullName}</td>
                                                        <td>{program.specialty.name}</td>
                                                        <td>{program.specialty.programCode}</td>
                                                        <td>{program.specialty.educationLevel}</td>
                                                        <td>{program.studyForm || '—'}</td>
                                                        <td>{program.duration || '—'}</td>
                                                        <td>{program.teachingLanguage || '—'}</td>
                                                        <td>
                                                            <span className={`badge ${program.mobilityOption ? 'bg-success' : 'bg-secondary'}`}>
                                                                {program.mobilityOption ? 'Доступна' : 'Недоступна'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => navigate(`/program/edit/${program.id}`)}
                                                            >
                                                                Редактировать
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                {/* Вкладка: Инфраструктура */}
                {/*<Tab eventKey="infrastructure" title="Инфраструктура">*/}
                {/*    <Card>*/}
                {/*        <Card.Header as="h5">Управление инфраструктурой</Card.Header>*/}
                {/*        <Card.Body>*/}
                {/*            <Card.Text>*/}
                {/*                Здесь вы сможете управлять инфраструктурой университета (общежития, библиотеки, спортзалы и т.д.).*/}
                {/*            </Card.Text>*/}
                {/*            <p className="text-muted">*/}
                {/*                Содержимое в разработке...*/}
                {/*            </p>*/}
                {/*        </Card.Body>*/}
                {/*    </Card>*/}
                {/*</Tab>*/}

                {/* Вкладка: Работники университета */}
                {/*<Tab eventKey="employees" title="Работники университета">*/}
                {/*    <Card>*/}
                {/*        <Card.Header as="h5">Управление работниками</Card.Header>*/}
                {/*        <Card.Body>*/}
                {/*            <Card.Text>*/}
                {/*                Здесь вы сможете управлять работниками университета (редакторы, администраторы).*/}
                {/*            </Card.Text>*/}
                {/*            <p className="text-muted">*/}
                {/*                Содержимое в разработке...*/}
                {/*            </p>*/}
                {/*        </Card.Body>*/}
                {/*    </Card>*/}
                {/*</Tab>*/}
            </Tabs>
        </Container>
    );
};

export default UniversityAdminPage;

