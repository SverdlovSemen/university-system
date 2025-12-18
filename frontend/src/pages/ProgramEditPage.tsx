import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner, Tab, Tabs, Modal } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createProgram, updateProgram, getProgramById } from '../api/programApi';
import { getFacultiesByUniversity } from '../api/facultyApi';
import { fetchAllSpecialties } from '../api/specialtyApi';
import { getAllStudyForms } from '../api/studyFormApi';
import { deleteAdmissionCondition, copyAdmissionCondition } from '../api/admissionConditionApi';
import { ProgramRequest, FacultyResponse, SpecialtyResponse, StudyFormResponse } from '../types';
import AdmissionConditionCard from '../components/AdmissionConditionCard';

const ProgramEditPage = () => {
    const navigate = useNavigate();
    const { programId } = useParams<{ programId?: string }>();
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

    // Обработчик изменения полей формы
    const handleInputChange = (field: keyof ProgramRequest, value: string | number | boolean | undefined) => {
        setSaveError(null);

        // Если изменился факультет, сбрасываем специальность
        if (field === 'facultyId') {
            setFormData(prev => ({
                ...prev,
                facultyId: value as number,
                specialtyId: 0
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
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

            // Перенаправляем обратно на страницу администрирования университета
            navigate('/university-admin');
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
        navigate('/university-admin');
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
            </Tabs>
        </Container>

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
                            onChange={(e) => setCopyTargetYear(e.target.value ? parseInt(e.target.value) : null)}
                        />
                        <Form.Text className="text-muted">
                            Год, для которого ещё нет условий поступления.
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
        </>
    );
};

export default ProgramEditPage;
