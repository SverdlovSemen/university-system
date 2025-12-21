import React, { useState, useEffect, useContext } from 'react';
import { Container, Tab, Tabs, Card, Form, Row, Col, Spinner, Alert, Button, Table, Modal } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { getUniversityById, updateUniversity } from '../api/universityApi';
import { fetchAllCities } from '../api/cityApi';
import { getFacultiesByUniversity, deleteFaculty } from '../api/facultyApi';
import { fetchProgramDetailsByUniversity, deleteProgram } from '../api/programApi';
import { UniversityResponse, CityResponse, UniversityRequest, FacultyResponse, ProgramResponse } from '../types';



const UniversityAdminPage = () => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        return searchParams.get('tab') || 'info';
    });
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

    // Состояния для ошибок полей
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

    // Состояния для факультетов
    const [faculties, setFaculties] = useState<FacultyResponse[]>([]);
    const [facultiesLoading, setFacultiesLoading] = useState(false);
    const [facultiesError, setFacultiesError] = useState<string | null>(null);

    // Состояния для программ
    const [programs, setPrograms] = useState<ProgramResponse[]>([]);
    const [programsLoading, setProgramsLoading] = useState(false);
    const [programsError, setProgramsError] = useState<string | null>(null);

    // Состояния для модальных окон удаления факультета
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [facultyToDelete, setFacultyToDelete] = useState<FacultyResponse | null>(null);
    const [targetFacultyId, setTargetFacultyId] = useState<number | null>(null);
    const [deletingFaculty, setDeletingFaculty] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Состояния для модального окна удаления программы
    const [showDeleteProgramModal, setShowDeleteProgramModal] = useState(false);
    const [programToDelete, setProgramToDelete] = useState<ProgramResponse | null>(null);
    const [deletingProgram, setDeletingProgram] = useState(false);
    const [deleteProgramError, setDeleteProgramError] = useState<string | null>(null);



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

    // Функция загрузки факультетов
    const loadFaculties = async (universityId: number) => {
        try {
            setFacultiesLoading(true);
            setFacultiesError(null);
            const facultiesData = await getFacultiesByUniversity(universityId);
            setFaculties(facultiesData);
        } catch (err) {
            console.error('Ошибка загрузки факультетов:', err);
            setFacultiesError('Не удалось загрузить список факультетов');
        } finally {
            setFacultiesLoading(false);
        }
    };

    // Загружаем факультеты при переключении на вкладку "Факультеты"
    useEffect(() => {
        if (activeTab === 'faculties' && university?.id) {
            loadFaculties(university.id);
        }
    }, [activeTab, university?.id]);

    // Функция загрузки программ
    const loadPrograms = async (universityId: number) => {
        try {
            setProgramsLoading(true);
            setProgramsError(null);
            const programsData = await fetchProgramDetailsByUniversity(universityId);
            setPrograms(programsData);
        } catch (err) {
            console.error('Ошибка загрузки программ:', err);
            setProgramsError('Не удалось загрузить список программ');
        } finally {
            setProgramsLoading(false);
        }
    };

    // Загружаем программы при переключении на вкладку "Программы"
    useEffect(() => {
        if (activeTab === 'programs' && university?.id) {
            loadPrograms(university.id);
        }
    }, [activeTab, university?.id]);



    // Функция валидации email
    const validateEmail = (email: string): string | null => {
        if (!email) return null; // Поле необязательное
        if (!email.includes('@')) {
            return 'Введите корректный email';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Введите корректный email';
        }
        return null;
    };

    // Функция валидации года основания
    const validateFoundedYear = (year: string): string | null => {
        if (!year) return null; // Поле необязательное
        const yearNum = parseInt(year);
        if (isNaN(yearNum)) {
            return 'Введите корректный год';
        }
        if (yearNum < 1724) {
            return 'Год основания Российского ВУЗа не может быть меньше 1724 г.';
        }
        if (yearNum > new Date().getFullYear()) {
            return 'Год основания ВУЗа не может быть больше текущего года';
        }
        return null;
    };

    // Функция валидации сайта
    const validateWebsite = (website: string): string | null => {
        if (!website) return null; // Поле необязательное
        // Разрешаем только http(s):// и домен, опционально путь
        const websiteRegex = /^(https?:\/\/)([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;
        if (!websiteRegex.test(website)) {
            return 'Введите корректный адрес сайта (например, https://example.com)';
        }
        return null;
    };

    // Обработчик изменения полей формы
    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Убираем ошибки полей при изменении данных
        setFieldErrors(prev => ({
            ...prev,
            [field]: ''
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
            setFieldErrors(prev => ({
                ...prev,
                fullName: 'Полное название университета обязательно для заполнения'
            }));
            setSaveError('Проверьте правильность заполнения полей');
            return;
        }

        if (!formData.abbreviation.trim()) {
            setFieldErrors(prev => ({
                ...prev,
                abbreviation: 'Аббревиатура университета обязательна для заполнения'
            }));
            setSaveError('Проверьте правильность заполнения полей');
            return;
        }

        if (!formData.type.trim()) {
            setFieldErrors(prev => ({
                ...prev,
                type: 'Тип ВУЗа обязателен для заполнения'
            }));
            setSaveError('Проверьте правильность заполнения полей');
            return;
        }

        if (!formData.cityId || formData.cityId === 0) {
            setFieldErrors(prev => ({
                ...prev,
                cityId: 'Необходимо выбрать город'
            }));
            setSaveError('Проверьте правильность заполнения полей');
            return;
        }

        // Валидация года основания
        if (formData.foundedYear.trim()) {
            const yearError = validateFoundedYear(formData.foundedYear.trim());
            if (yearError) {
                setFieldErrors(prev => ({
                    ...prev,
                    foundedYear: yearError
                }));
                setSaveError('Проверьте правильность заполнения полей');
                return;
            }
        }

        // Валидация сайта
        if (formData.website.trim()) {
            const websiteError = validateWebsite(formData.website.trim());
            if (websiteError) {
                setFieldErrors(prev => ({
                    ...prev,
                    website: websiteError
                }));
                setSaveError('Проверьте правильность заполнения полей');
                return;
            }
        }

        // Валидация email администрации
        if (formData.adminEmail.trim()) {
            const emailError = validateEmail(formData.adminEmail.trim());
            if (emailError) {
                setFieldErrors(prev => ({
                    ...prev,
                    adminEmail: emailError
                }));
                setSaveError('Проверьте правильность заполнения полей');
                return;
            }
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

    // Обработчики модальных окон удаления факультета
    const handleOpenDeleteModal = (faculty: FacultyResponse) => {
        setFacultyToDelete(faculty);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setFacultyToDelete(null);
        setDeleteError(null);
    };

    const handleDeleteWithPrograms = async () => {
        if (!facultyToDelete) return;

        try {
            setDeletingFaculty(true);
            setDeleteError(null);

            // Удаляем факультет (каскадно удалятся все программы и связанные данные)
            await deleteFaculty(facultyToDelete.id);

            // Закрываем модальное окно
            handleCloseDeleteModal();

            // Обновляем список факультетов
            if (university?.id) {
                await loadFaculties(university.id);
            }

            // Можно показать уведомление об успешном удалении
            alert(`Факультет "${facultyToDelete.fullName}" успешно удален вместе со всеми программами`);

        } catch (err: any) {
            console.error('Ошибка удаления факультета:', err);

            let errorMessage = 'Не удалось удалить факультет';

            if (err.response?.status === 403) {
                errorMessage = 'Доступ запрещен. У вас недостаточно прав для удаления этого факультета.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data) {
                errorMessage = typeof err.response.data === 'string'
                    ? err.response.data
                    : JSON.stringify(err.response.data);
            } else if (err.message) {
                errorMessage = err.message;
            }

            setDeleteError(errorMessage);
        } finally {
            setDeletingFaculty(false);
        }
    };

    const handleOpenTransferModal = () => {
        // Проверяем, есть ли другие факультеты кроме удаляемого
        if (faculties.length <= 1) {
            setDeleteError('В вашем университете больше нет факультетов');
            return;
        }
        setShowDeleteModal(false);
        setShowTransferModal(true);
    };

    const handleCloseTransferModal = () => {
        setShowTransferModal(false);
        setFacultyToDelete(null);
        setTargetFacultyId(null);
        setDeleteError(null);
    };

    const handleTransferAndDeleteFaculty = async () => {
        if (!facultyToDelete || !targetFacultyId) {
            setDeleteError('Выберите факультет для переноса программ');
            return;
        }

        try {
            setDeletingFaculty(true);
            setDeleteError(null);

            console.log('Отправка запроса на перенос программ:', {
                sourceFacultyId: facultyToDelete.id,
                targetFacultyId: targetFacultyId
            });

            // Вызываем API для переноса программ и удаления факультета
            await axios.post('/api/faculties/transfer-and-delete', {
                sourceFacultyId: facultyToDelete.id,
                targetFacultyId: targetFacultyId
            });

            // Закрываем модальное окно
            handleCloseTransferModal();

            // Перезагружаем список факультетов
            if (university?.id) {
                loadFaculties(university.id);
            }

            alert(`Программы факультета "${facultyToDelete.fullName}" успешно перенесены, факультет удален`);

        } catch (err: any) {
            console.error('Ошибка переноса программ и удаления факультета:', err);
            console.error('Детали ответа:', err.response);
            console.error('Данные ошибки:', err.response?.data);

            let errorMessage = 'Не удалось перенести программы и удалить факультет';

            if (err.response?.status === 403) {
                errorMessage = 'Доступ запрещен. У вас недостаточно прав для выполнения этой операции.';
            } else if (err.response?.status === 400) {
                // Специальная обработка для 400 ошибки
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (typeof err.response?.data === 'string') {
                    errorMessage = err.response.data;
                } else {
                    errorMessage = 'Некорректный запрос. Проверьте выбранные данные.';
                }
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data) {
                errorMessage = typeof err.response.data === 'string'
                    ? err.response.data
                    : JSON.stringify(err.response.data);
            } else if (err.message) {
                errorMessage = err.message;
            }

            setDeleteError(errorMessage);
        } finally {
            setDeletingFaculty(false);
        }
    };

    // Обработчики модального окна удаления программы
    const handleOpenDeleteProgramModal = (program: ProgramResponse) => {
        setProgramToDelete(program);
        setShowDeleteProgramModal(true);
    };

    const handleCloseDeleteProgramModal = () => {
        setShowDeleteProgramModal(false);
        setProgramToDelete(null);
        setDeleteProgramError(null);
    };

    const handleDeleteProgram = async () => {
        if (!programToDelete) return;

        try {
            setDeletingProgram(true);
            setDeleteProgramError(null);

            // Удаляем программу
            await deleteProgram(programToDelete.id);

            // Закрываем модальное окно
            handleCloseDeleteProgramModal();

            // Обновляем список программ
            if (university?.id) {
                await loadPrograms(university.id);
            }


        } catch (err: any) {
            console.error('Ошибка удаления программы:', err);

            let errorMessage = 'Не удалось удалить программу';

            if (err.response?.status === 403) {
                errorMessage = 'Доступ запрещен. У вас недостаточно прав для удаления этой программы.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data) {
                errorMessage = typeof err.response.data === 'string'
                    ? err.response.data
                    : JSON.stringify(err.response.data);
            } else if (err.message) {
                errorMessage = err.message;
            }

            setDeleteProgramError(errorMessage);
        } finally {
            setDeletingProgram(false);
        }
    };

    return (
        <Container className="mt-4">
                <h2 className="mb-4">Панель администратора университета</h2>

            <Tabs
                id="university-admin-tabs"
                activeKey={activeTab}
                onSelect={(k) => {
                    const tab = k || 'info';
                    setActiveTab(tab);
                    // Обновляем URL без перезагрузки страницы
                    const newSearchParams = new URLSearchParams(searchParams);
                    newSearchParams.set('tab', tab);
                    navigate(`?${newSearchParams.toString()}`, { replace: true });
                }}
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
                                                    maxLength={100}
                                                    isInvalid={!!fieldErrors.fullName}
                                                />
                                                {fieldErrors.fullName && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {fieldErrors.fullName}
                                                    </Form.Control.Feedback>
                                                )}
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
                                                    maxLength={30}
                                                    isInvalid={!!fieldErrors.abbreviation}
                                                />
                                                {fieldErrors.abbreviation && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {fieldErrors.abbreviation}
                                                    </Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Тип</strong></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.type}
                                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                                    maxLength={30}
                                                    isInvalid={!!fieldErrors.type}
                                                />
                                                {fieldErrors.type && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {fieldErrors.type}
                                                    </Form.Control.Feedback>
                                                )}
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
                                                    maxLength={30}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Город</strong></Form.Label>
                                                <Form.Select
                                                    value={formData.cityId}
                                                    onChange={(e) => handleInputChange('cityId', parseInt(e.target.value))}
                                                    isInvalid={!!fieldErrors.cityId}
                                                >
                                                    <option value={0}>Выберите город</option>
                                                    {cities.map(city => (
                                                        <option key={city.id} value={city.id}>
                                                            {city.name}, {city.region.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                {fieldErrors.cityId && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {fieldErrors.cityId}
                                                    </Form.Control.Feedback>
                                                )}
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
                                                    onKeyDown={(e)=>{
                                                        if(!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight/.test(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                        if(formData.foundedYear.length > 10 && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    min="1724"
                                                    max={new Date().getFullYear()}
                                                    isInvalid={!!fieldErrors.foundedYear}
                                                />
                                                {fieldErrors.foundedYear && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {fieldErrors.foundedYear}
                                                    </Form.Control.Feedback>
                                                )}
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
                                                    maxLength={40}
                                                    isInvalid={!!fieldErrors.website}
                                                />
                                                {fieldErrors.website && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {fieldErrors.website}
                                                    </Form.Control.Feedback>
                                                )}
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
                                                    maxLength={40}
                                                    placeholder="admin@university.com"
                                                    isInvalid={!!fieldErrors.adminEmail}
                                                />
                                                {fieldErrors.adminEmail && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {fieldErrors.adminEmail}
                                                    </Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label><strong>Телефон администрации</strong></Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    value={formData.adminPhone}
                                                    onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                                                    onKeyDown={(e)=>{
                                                        if(!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight/.test(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    maxLength={12}
                                                    placeholder="79999999999"
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
                                                            className="me-2"
                                                        >
                                                            Редактировать
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleOpenDeleteModal(faculty)}
                                                        >
                                                            Удалить
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
                                                            <div className="d-flex gap-2">
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    onClick={() => navigate(`/program/edit/${program.id}`)}
                                                                >
                                                                    Редактировать
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => handleOpenDeleteProgramModal(program)}
                                                                >
                                                                    Удалить
                                                                </Button>
                                                            </div>
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

                 {/*Вкладка: Инфраструктура*/}
                <Tab eventKey="infrastructure" title="Инфраструктура">
                    <Card>
                        <Card.Header as="h5">Управление инфраструктурой</Card.Header>
                        <Card.Body>
                            <Card.Text>
                                Здесь вы сможете управлять инфраструктурой университета (общежития, библиотеки, спортзалы и т.д.).
                            </Card.Text>
                            <p className="text-muted">
                                Содержимое в разработке...
                            </p>
                        </Card.Body>
                    </Card>
                </Tab>

                 {/*Вкладка: Работники университета*/}
                <Tab eventKey="employees" title="Работники университета">
                    <Card>
                        <Card.Header as="h5">Управление работниками</Card.Header>
                        <Card.Body>
                            <Card.Text>
                                Здесь вы сможете управлять работниками университета (редакторы, администраторы).
                            </Card.Text>
                            <p className="text-muted">
                                Содержимое в разработке...
                            </p>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Модальное окно подтверждения удаления факультета */}
            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Удаление факультета</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {facultyToDelete && (
                        <>
                            <p>Вы уверены, что хотите удалить факультет <strong>"{facultyToDelete.fullName}"</strong>?</p>
                            <Alert variant="warning">
                                Выберите один из вариантов удаления:
                            </Alert>
                            {deleteError && (
                                <Alert variant="danger" className="mt-3">
                                    {deleteError}
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal} disabled={deletingFaculty}>
                        Отмена
                    </Button>
                    <Button variant="danger" onClick={handleDeleteWithPrograms} disabled={deletingFaculty}>
                        {deletingFaculty ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Удаление...
                            </>
                        ) : (
                            'Удалить вместе с программами'
                        )}
                    </Button>
                    <Button variant="primary" onClick={handleOpenTransferModal} disabled={deletingFaculty}>
                        Удалить и перевести все программы на другой факультет
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно переноса программ на другой факультет */}
            <Modal show={showTransferModal} onHide={handleCloseTransferModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Перенос программ на другой факультет</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {facultyToDelete && (
                        <>
                            <p>Перенос программ факультета <strong>"{facultyToDelete.fullName}"</strong> на другой факультет.</p>

                            <Form.Group className="mb-3">
                                <Form.Label>Выберите факультет для переноса программ</Form.Label>
                                <Form.Select
                                    value={targetFacultyId || ''}
                                    onChange={(e) => setTargetFacultyId(e.target.value ? Number(e.target.value) : null)}
                                    disabled={deletingFaculty}
                                >
                                    <option value="">-- Выберите факультет --</option>
                                    {faculties
                                        .filter(f => f.id !== facultyToDelete.id)
                                        .map(faculty => (
                                            <option key={faculty.id} value={faculty.id}>
                                                {faculty.fullName} ({faculty.abbreviation})
                                            </option>
                                        ))
                                    }
                                </Form.Select>
                            </Form.Group>

                            {deleteError && (
                                <Alert variant="danger" className="mt-3">
                                    {deleteError}
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseTransferModal} disabled={deletingFaculty}>
                        Отмена
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleTransferAndDeleteFaculty}
                        disabled={deletingFaculty || !targetFacultyId}
                    >
                        {deletingFaculty ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Выполнение...
                            </>
                        ) : (
                            'Перенести программы и удалить факультет'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно подтверждения удаления программы */}
            <Modal show={showDeleteProgramModal} onHide={handleCloseDeleteProgramModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Удаление программы</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {programToDelete && (
                        <>
                            <p>
                                Вы уверены, что хотите удалить программу <strong>"{programToDelete.specialty.name}"</strong>?
                            </p>
                            <Alert variant="warning">
                                <strong>Внимание!</strong> Это действие нельзя отменить. Будут удалены все связанные данные программы.
                            </Alert>
                            {deleteProgramError && (
                                <Alert variant="danger" className="mt-3">
                                    {deleteProgramError}
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteProgramModal} disabled={deletingProgram}>
                        Отмена
                    </Button>
                    <Button variant="danger" onClick={handleDeleteProgram} disabled={deletingProgram}>
                        {deletingProgram ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Удаление...
                            </>
                        ) : (
                            'Удалить программу'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UniversityAdminPage;

