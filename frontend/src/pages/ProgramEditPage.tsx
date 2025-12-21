import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner, Tab, Tabs, Modal } from 'react-bootstrap';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createProgram, updateProgram, getProgramById } from '../api/programApi';
import { getFacultiesByUniversity } from '../api/facultyApi';
import { fetchAllSpecialties } from '../api/specialtyApi';
import { getAllStudyForms } from '../api/studyFormApi';
import { deleteAdmissionCondition, copyAdmissionCondition } from '../api/admissionConditionApi';
import { createDiscipline, updateDiscipline, deleteDiscipline, DisciplineRequest } from '../api/disciplineApi';
import { ProgramRequest, FacultyResponse, SpecialtyResponse, StudyFormResponse, DisciplineResponse } from '../types';
import AdmissionConditionCard from '../components/AdmissionConditionCard';

const ProgramEditPage = () => {
    const navigate = useNavigate();
    const { programId } = useParams<{ programId?: string }>();
    const [searchParams] = useSearchParams();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const isEditMode = !!programId;
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [programData, setProgramData] = useState<any>(null);
    const [deletingConditionId, setDeletingConditionId] = useState<number | null>(null);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copySourceId, setCopySourceId] = useState<number | null>(null);
    const [copyTargetYear, setCopyTargetYear] = useState<number | null>(null);
    const [copyError, setCopyError] = useState<string | null>(null);
    const [copyLoading, setCopyLoading] = useState(false);

    // Состояния для дисциплин
    const [disciplines, setDisciplines] = useState<DisciplineResponse[]>([]);
    const [showDisciplineModal, setShowDisciplineModal] = useState(false);
    const [savingDiscipline, setSavingDiscipline] = useState(false);
    const [disciplineFormData, setDisciplineFormData] = useState<DisciplineRequest>({
        name: '',
        semester: 1,
        totalHours: 0
    });
    const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineResponse | null>(null);
    const [disciplineError, setDisciplineError] = useState<string | null>(null);

    // Данные для селектов
    const [faculties, setFaculties] = useState<FacultyResponse[]>([]);
    const [specialties, setSpecialties] = useState<SpecialtyResponse[]>([]);
    const [studyForms, setStudyForms] = useState<StudyFormResponse[]>([]);
    const [loadingFaculties, setLoadingFaculties] = useState(true);
    const [loadingSpecialties, setLoadingSpecialties] = useState(false);
    const [loadingStudyForms, setLoadingStudyForms] = useState(false);

    const [formData, setFormData] = useState<ProgramRequest>({
        facultyId: 0,
        specialtyId: 0,
        programDescription: '',
        studyFormId: undefined,
        duration: '',
        mobilityOption: false,
        teachingLanguage: ''
    });

    const universityId = user?.universityIds?.[0];

    // Устанавливаем активную вкладку из параметров URL
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['info', 'admission', 'disciplines'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Загружаем факультеты при монтировании
    useEffect(() => {
        const loadFaculties = async () => {
            if (universityId) {
                try {
                    setLoadingFaculties(true);
                    const facultiesData = await getFacultiesByUniversity(universityId);
                    setFaculties(facultiesData);
                } catch (err) {
                    console.error('Ошибка загрузки факультетов:', err);
                    setError('Не удалось загрузить список факультетов');
                } finally {
                    setLoadingFaculties(false);
                }
            }
        };

        if (user) {
            loadFaculties();
        }
    }, [user, universityId]);

    // Загружаем все специальности один раз при монтировании
    useEffect(() => {
        if (!user) return;

        const loadSpecialties = async () => {
            try {
                setLoadingSpecialties(true);
                const specialtiesData = await fetchAllSpecialties();
                setSpecialties(specialtiesData);
            } catch (err) {
                console.error('Ошибка загрузки специальностей:', err);
                setSpecialties([]);
            } finally {
                setLoadingSpecialties(false);
            }
        };

        loadSpecialties();
    }, [user]);

    // Загружаем формы обучения при монтировании
    useEffect(() => {
        if (!user) return;

        const loadStudyForms = async () => {
            try {
                setLoadingStudyForms(true);
                const studyFormsData = await getAllStudyForms();
                setStudyForms(studyFormsData);
            } catch (err) {
                console.error('Ошибка загрузки форм обучения:', err);
                setStudyForms([]);
            } finally {
                setLoadingStudyForms(false);
            }
        };

        loadStudyForms();
    }, [user]);

    // Загружаем данные программы при редактировании
    useEffect(() => {
        const loadProgram = async () => {
            if (isEditMode && programId) {
                try {
                    setLoading(true);
                    setError(null);

                    const program = await getProgramById(parseInt(programId));
                    setProgramData(program);

                    setFormData({
                        facultyId: program.faculty.id,
                        specialtyId: program.specialty.id,
                        programDescription: program.programDescription || '',
                        studyFormId: program.studyFormId,
                        duration: program.duration || '',
                        mobilityOption: program.mobilityOption,
                        teachingLanguage: program.teachingLanguage || ''
                    });
                } catch (err) {
                    console.error('Ошибка загрузки программы:', err);
                    setError('Не удалось загрузить данные программы');
                } finally {
                    setLoading(false);
                }
            }
        };

        if (user && !loadingFaculties) {
            loadProgram();
        }
    }, [isEditMode, programId, user, loadingFaculties]);

    // Загружаем дисциплины из данных программы при переключении на вкладку
    useEffect(() => {
        if (isEditMode && programData && activeTab === 'disciplines') {
            setDisciplines(programData.disciplines || []);
        }
    }, [isEditMode, programData, activeTab]);

    // Обработчик изменения полей формы
    const handleInputChange = (field: keyof ProgramRequest, value: string | number | boolean | undefined) => {
        setSaveError(null);

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Валидация формы
    const validateForm = (): string | null => {
        if (!formData.facultyId || formData.facultyId === 0) {
            return 'Выберите факультет';
        }

        if (!formData.specialtyId || formData.specialtyId === 0) {
            return 'Выберите специальность';
        }

        return null;
    };

    // Обработчик сохранения
    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setSaveError(validationError);
            return;
        }

        try {
            setSaving(true);
            setSaveError(null);

            // Подготавливаем данные для отправки
            const requestData: ProgramRequest = {
                facultyId: formData.facultyId,
                specialtyId: formData.specialtyId,
                programDescription: formData.programDescription?.trim() || undefined,
                studyFormId: formData.studyFormId,
                duration: formData.duration?.trim() || undefined,
                mobilityOption: formData.mobilityOption,
                teachingLanguage: formData.teachingLanguage?.trim() || undefined
            };

            if (isEditMode && programId) {
                await updateProgram(parseInt(programId), requestData);
            } else {
                await createProgram(requestData);
            }

            // Перенаправляем обратно на страницу администрирования университета на вкладку "Программы"
            navigate('/university-admin?tab=programs');
        } catch (err: any) {
            console.error('Ошибка сохранения программы:', err);

            let errorMessage = `Не удалось ${isEditMode ? 'обновить' : 'создать'} программу`;

            if (err.response?.status === 403) {
                errorMessage = 'Доступ запрещен. У вас недостаточно прав для выполнения этой операции.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setSaveError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/university-admin?tab=programs');
    };

    const handleEditCondition = (conditionId: number) => {
        navigate(`/program/edit/${programId}/admission-condition/${conditionId}`);
    };

    const handleAddCondition = () => {
        navigate(`/program/edit/${programId}/admission-condition/new`);
    };

    const handleDeleteCondition = async (conditionId: number) => {
        if (!programId) return;

        if (window.confirm('Вы уверены, что хотите удалить это условие поступления?')) {
            try {
                setDeletingConditionId(conditionId);
                await deleteAdmissionCondition(parseInt(programId), conditionId);

                // Перезагружаем данные программы
                const program = await getProgramById(parseInt(programId));
                setProgramData(program);
            } catch (err) {
                console.error('Ошибка удаления условия поступления:', err);
                alert('Не удалось удалить условие поступления');
            } finally {
                setDeletingConditionId(null);
            }
        }
    };

    const handleOpenCopyModal = () => {
        setCopyError(null);
        setCopyTargetYear(null);
        setCopySourceId(null);
        setShowCopyModal(true);
    };

    const handleCloseCopyModal = () => {
        setShowCopyModal(false);
        setCopyError(null);
    };

    const handleCopyCondition = async () => {
        if (!programId || copySourceId === null || copyTargetYear === null) {
            setCopyError('Выберите исходное условие и укажите целевой год');
            return;
        }

        // Проверяем диапазон года
        if (copyTargetYear < 2009 || copyTargetYear > 2025) {
            setCopyError('Год должен быть в диапазоне от 2009 до 2025');
            return;
        }

        // Проверяем, что выбранный целевой год ещё не используется
        const targetExists = programData?.admissionConditions?.some((c: any) => c.year === copyTargetYear);
        if (targetExists) {
            setCopyError('Для выбранного года уже есть условие поступления');
            return;
        }

        try {
            setCopyLoading(true);
            setCopyError(null);
            const updatedConditions = await copyAdmissionCondition(parseInt(programId), copySourceId, copyTargetYear);
            // Обновляем данные программы
            setProgramData((prev: any) => ({
                ...prev,
                admissionConditions: updatedConditions
            }));
            handleCloseCopyModal();
        } catch (err: any) {
            console.error('Ошибка копирования условия поступления:', err);
            const message = err.response?.data || err.message || 'Не удалось скопировать условие поступления';
            setCopyError(message);
        } finally {
            setCopyLoading(false);
        }
    };

    // Обработчики для дисциплин
    const handleOpenDisciplineModal = () => {
        // режим создания
        setSelectedDiscipline(null);
        setDisciplineError(null);
        setDisciplineFormData({
            name: '',
            semester: 1,
            totalHours: 0
        });
        setShowDisciplineModal(true);
    };

    const handleOpenEditDisciplineModal = (discipline: DisciplineResponse) => {
        setSelectedDiscipline(discipline);
        setDisciplineError(null);
        setDisciplineFormData({
            name: discipline.name,
            semester: discipline.semester,
            totalHours: discipline.totalHours
        });
        setShowDisciplineModal(true);
    };

    const handleCloseDisciplineModal = () => {
        setShowDisciplineModal(false);
        setSelectedDiscipline(null);
        setDisciplineError(null);
        setDisciplineFormData({
            name: '',
            semester: 1,
            totalHours: 0
        });
    };

    const handleDisciplineInputChange = (field: keyof DisciplineRequest, value: string | number) => {
        setDisciplineError(null);
        setDisciplineFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateDisciplineForm = (): string | null => {
        if (!disciplineFormData.name.trim()) {
            return 'Введите название дисциплины';
        }
        if (disciplineFormData.semester < 1) {
            return 'Семестр должен быть больше 0';
        }
        if (disciplineFormData.totalHours < 1) {
            return 'Количество часов должно быть больше 0';
        }
        return null;
    };

    const handleSaveDiscipline = async () => {
        if (!programId) return;

        const validationError = validateDisciplineForm();
        if (validationError) {
            setDisciplineError(validationError);
            return;
        }

        try {
            setSavingDiscipline(true);

            if (selectedDiscipline) {
                // режим редактирования
                const updated = await updateDiscipline(parseInt(programId), selectedDiscipline.id, disciplineFormData);

                // Обновляем список дисциплин
                setDisciplines(prev => prev.map(d => (d.id === updated.id ? updated : d)));

                // Обновляем данные программы
                setProgramData((prev: any) => ({
                    ...prev,
                    disciplines: (prev.disciplines || []).map((d: DisciplineResponse) => (d.id === updated.id ? updated : d))
                }));
            } else {
                // режим создания
                const newDiscipline = await createDiscipline(parseInt(programId), disciplineFormData);

                setDisciplines(prev => [...prev, newDiscipline]);
                setProgramData((prev: any) => ({
                    ...prev,
                    disciplines: [...(prev.disciplines || []), newDiscipline]
                }));
            }

            handleCloseDisciplineModal();
        } catch (err: any) {
            console.error('Ошибка сохранения дисциплины:', err);
            setDisciplineError(err.response?.data?.message || err.message || 'Не удалось сохранить дисциплину');
        } finally {
            setSavingDiscipline(false);
        }
    };

    const handleDeleteDiscipline = async () => {
        if (!programId || !selectedDiscipline) return;

        if (!window.confirm('Вы уверены, что хотите удалить эту дисциплину?')) {
            return;
        }

        try {
            setSavingDiscipline(true);
            await deleteDiscipline(parseInt(programId), selectedDiscipline.id);

            // Удаляем из локального списка
            setDisciplines(prev => prev.filter(d => d.id !== selectedDiscipline.id));
            setProgramData((prev: any) => ({
                ...prev,
                disciplines: (prev.disciplines || []).filter((d: DisciplineResponse) => d.id !== selectedDiscipline.id)
            }));

            handleCloseDisciplineModal();
        } catch (err: any) {
            console.error('Ошибка удаления дисциплины:', err);
            setDisciplineError(err.response?.data?.message || err.message || 'Не удалось удалить дисциплину');
        } finally {
            setSavingDiscipline(false);
        }
    };

    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [selectedConditionId, setSelectedConditionId] = React.useState<number | null>(null);

    const handleRequestDeleteCondition = (conditionId: number) => {
        setSelectedConditionId(conditionId);
        setShowDeleteModal(true);
    };

    const handleConfirmDeleteCondition = async () => {
        if (selectedConditionId !== null && programId) {
            try {
                setDeletingConditionId(selectedConditionId);
                setShowDeleteModal(false);
                await deleteAdmissionCondition(parseInt(programId), selectedConditionId);
                // Перезагружаем данные программы
                const program = await getProgramById(parseInt(programId));
                setProgramData(program);
            } catch (err) {
                console.error('Ошибка удаления условия поступления:', err);
                alert('Не удалось удалить условие поступления');
            } finally {
                setDeletingConditionId(null);
                setSelectedConditionId(null);
            }
        }
    };

    const handleCancelDeleteCondition = () => {
        setShowDeleteModal(false);
        setSelectedConditionId(null);
    };

    if (loading || loadingFaculties) {
        return (
            <Container className="mt-4">
                <div className="text-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </Spinner>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Button variant="secondary" onClick={handleCancel}>
                    Вернуться назад
                </Button>
            </Container>
        );
    }

    return (
        <>
            <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{isEditMode ? 'Редактирование программы' : 'Добавление программы'}</h2>
                <Button variant="secondary" onClick={handleCancel}>
                    ← Назад
                </Button>
            </div>

            <Tabs
                id="program-edit-tabs"
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'info')}
                className="mb-3"
            >
                {/* Вкладка: Основная информация */}
                <Tab eventKey="info" title="Основная информация">
                    <Card>
                        <Card.Body>
                            <Form>
                                {/* Факультет и специальность */}
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Факультет *</strong></Form.Label>
                                            <Form.Select
                                                value={formData.facultyId}
                                                onChange={(e) => handleInputChange('facultyId', parseInt(e.target.value))}
                                                required
                                            >
                                                <option value={0}>Выберите факультет</option>
                                                {faculties.map(faculty => (
                                                    <option key={faculty.id} value={faculty.id}>
                                                        {faculty.fullName} {faculty.abbreviation ? `(${faculty.abbreviation})` : ''}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Специальность *</strong></Form.Label>
                                            <Form.Select
                                                value={formData.specialtyId}
                                                onChange={(e) => handleInputChange('specialtyId', parseInt(e.target.value))}
                                                disabled={loadingSpecialties}
                                                required
                                            >
                                                <option value={0}>
                                                    {loadingSpecialties
                                                        ? 'Загрузка...'
                                                        : 'Выберите специальность'
                                                    }
                                                </option>
                                                {specialties.map(specialty => (
                                                    <option key={specialty.id} value={specialty.id}>
                                                        {specialty.name} ({specialty.programCode}) - {specialty.educationLevel}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Описание программы */}
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label><strong>Описание программы</strong></Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                value={formData.programDescription}
                                                onChange={(e) => handleInputChange('programDescription', e.target.value)}
                                                placeholder="Краткое описание образовательной программы"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Форма обучения и продолжительность */}
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Форма обучения</strong></Form.Label>
                                            <Form.Select
                                                value={formData.studyFormId || ''}
                                                onChange={(e) => handleInputChange('studyFormId', e.target.value ? parseInt(e.target.value) : undefined)}
                                                disabled={loadingStudyForms}
                                            >
                                                <option value="">
                                                    {loadingStudyForms
                                                        ? 'Загрузка...'
                                                        : 'Выберите форму обучения'
                                                    }
                                                </option>
                                                {studyForms.map(studyForm => (
                                                    <option key={studyForm.id} value={studyForm.id}>
                                                        {studyForm.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Продолжительность обучения</strong></Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.duration}
                                                onChange={(e) => handleInputChange('duration', e.target.value)}
                                                placeholder="Например: 4 года, 2 года"
                                                maxLength={80}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Язык обучения и мобильность */}
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Язык обучения</strong></Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.teachingLanguage}
                                                onChange={(e) => handleInputChange('teachingLanguage', e.target.value)}
                                                placeholder="Например: Русский, Английский"
                                                maxLength={80}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Академическая мобильность</strong></Form.Label>
                                            <div className="mt-2">
                                                <Form.Check
                                                    type="checkbox"
                                                    id="mobilityOption"
                                                    label="Доступна академическая мобильность"
                                                    checked={formData.mobilityOption}
                                                    onChange={(e) => handleInputChange('mobilityOption', e.target.checked)}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Сообщения об ошибках */}
                                {saveError && (
                                    <Alert variant="danger" className="mb-3">
                                        {saveError}
                                    </Alert>
                                )}

                                {/* Кнопки */}
                                <Row>
                                    <Col>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="primary"
                                                onClick={handleSave}
                                                disabled={saving}
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
                                                        {isEditMode ? 'Сохранение...' : 'Создание...'}
                                                    </>
                                                ) : (
                                                    isEditMode ? 'Сохранить изменения' : 'Создать программу'
                                                )}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={handleCancel}
                                                disabled={saving}
                                            >
                                                Отмена
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* Вкладка: Условия поступления (только в режиме редактирования) */}
                {isEditMode && (
                    <Tab eventKey="admission" title="Условия поступления">
                        <div className="mb-3 d-flex gap-2 flex-wrap">
                            <Button
                                variant="success"
                                onClick={handleAddCondition}
                                className="d-flex align-items-center gap-2"
                            >
                                <i className="bi bi-plus-circle"></i>
                                Добавить условия поступления
                            </Button>
                            <Button
                                variant="outline-primary"
                                onClick={handleOpenCopyModal}
                                className="d-flex align-items-center gap-2"
                            >
                                <i className="bi bi-lightning-charge"></i>
                                Быстрое создание условия
                            </Button>
                        </div>

                        {programData?.admissionConditions && programData.admissionConditions.length > 0 ? (
                            <div>
                                {programData.admissionConditions.map((condition: any) => (
                                    <div key={condition.id} className="position-relative">
                                        <AdmissionConditionCard
                                            condition={condition}
                                            onEdit={handleEditCondition}
                                            onDelete={handleRequestDeleteCondition}
                                        />
                                        {deletingConditionId === condition.id && (
                                            <div className="position-absolute top-50 start-50 translate-middle">
                                                <Spinner animation="border" variant="primary" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <Card.Body>
                                    <p className="text-muted mb-0">
                                        Условия поступления еще не добавлены. Нажмите кнопку выше, чтобы добавить их.
                                    </p>
                                </Card.Body>
                            </Card>
                        )}
                    </Tab>
                )}

                {/* Вкладка: Дисциплины (только в режиме редактирования) */}
                {isEditMode && (
                    <Tab eventKey="disciplines" title="Дисциплины">
                        <div className="mb-3">
                            <Button
                                variant="success"
                                onClick={handleOpenDisciplineModal}
                                className="d-flex align-items-center gap-2"
                            >
                                <i className="bi bi-plus-circle"></i>
                                Добавить дисциплину
                            </Button>
                        </div>

                        {disciplines.length > 0 ? (
                            <Card>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Название дисциплины</th>
                                                    <th>Семестр</th>
                                                    <th>Количество часов</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {disciplines.map((discipline) => (
                                                    <tr key={discipline.id}>
                                                        <td>{discipline.name}</td>
                                                        <td>{discipline.semester}</td>
                                                        <td>{discipline.totalHours}</td>
                                                        <td className="text-end">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => handleOpenEditDisciplineModal(discipline)}
                                                            >
                                                                Редактировать
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card.Body>
                            </Card>
                        ) : (
                            <Card>
                                <Card.Body>
                                    <p className="text-muted mb-0">
                                        Дисциплины еще не добавлены. Нажмите кнопку выше, чтобы добавить их.
                                    </p>
                                </Card.Body>
                            </Card>
                        )}
                    </Tab>
                )}
            </Tabs>
            </Container>

            {/* Модальное окно для копирования условий поступления */}
            <Modal show={showCopyModal} onHide={handleCloseCopyModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Быстрое создание условия</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Исходный год</Form.Label>
                            <Form.Select
                                value={copySourceId ?? ''}
                                onChange={(e) => setCopySourceId(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">Выберите год для копирования</option>
                                {programData?.admissionConditions?.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.year}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Новый год</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Например: 2025"
                                value={copyTargetYear ?? ''}
                                onChange={(e) => {
                                    const year = e.target.value ? parseInt(e.target.value) : null;
                                    setCopyTargetYear(year);
                                    // Очищаем ошибку при изменении поля
                                    setCopyError(null);
                                }}
                                min={2009}
                                max={2025}
                                isInvalid={copyTargetYear !== null && (copyTargetYear < 2009 || copyTargetYear > 2025)}
                                onKeyDown={(e) => {
                                    // Разрешаем только цифры, клавиши навигации и управляющие клавиши
                                    if (!/[0-9]/.test(e.key) &&
                                        !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            <Form.Control.Feedback type="invalid">
                                {copyTargetYear !== null && copyTargetYear < 2009 && "Год не может быть меньше 2009"}
                                {copyTargetYear !== null && copyTargetYear > 2025 && "Год не может быть больше 2025"}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Укажите год от 2009 до 2025, для которого ещё нет условий поступления.
                            </Form.Text>
                        </Form.Group>

                        {copyError && (
                            <Alert variant="danger" className="mb-0">
                                {copyError}
                            </Alert>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseCopyModal} disabled={copyLoading}>
                        Отмена
                    </Button>
                    <Button variant="primary" onClick={handleCopyCondition} disabled={copyLoading}>
                        {copyLoading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Копирование...
                            </>
                        ) : (
                            'Скопировать'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно для добавления / редактирования дисциплины */}
            <Modal show={showDisciplineModal} onHide={handleCloseDisciplineModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedDiscipline ? 'Редактирование дисциплины' : 'Добавление дисциплины'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Название дисциплины *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Например: Математический анализ"
                                value={disciplineFormData.name}
                                onChange={(e) => handleDisciplineInputChange('name', e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Семестр *</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                value={disciplineFormData.semester}
                                onChange={(e) => handleDisciplineInputChange('semester', parseInt(e.target.value) || 1)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Количество часов *</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                value={disciplineFormData.totalHours}
                                onChange={(e) => handleDisciplineInputChange('totalHours', parseInt(e.target.value) || 0)}
                            />
                        </Form.Group>

                        {disciplineError && (
                            <Alert variant="danger" className="mb-0">
                                {disciplineError}
                            </Alert>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    {selectedDiscipline && (
                        <Button
                            variant="danger"
                            onClick={handleDeleteDiscipline}
                            disabled={savingDiscipline}
                        >
                            Удалить
                        </Button>
                    )}
                    <Button variant="secondary" onClick={handleCloseDisciplineModal} disabled={savingDiscipline}>
                        Отмена
                    </Button>
                    <Button variant="primary" onClick={handleSaveDiscipline} disabled={savingDiscipline}>
                        {savingDiscipline ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Сохранение...
                            </>
                        ) : (
                            selectedDiscipline ? 'Сохранить изменения' : 'Добавить'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно подтверждения удаления условия поступления */}
            <Modal show={showDeleteModal} onHide={handleCancelDeleteCondition} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Подтвердите удаление</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Вы уверены, что хотите удалить это условие поступления? Это действие необратимо.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCancelDeleteCondition}>
                        Отмена
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDeleteCondition}>
                        Удалить
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ProgramEditPage;
