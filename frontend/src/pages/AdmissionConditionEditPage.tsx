import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner, Tab, Tabs } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import {
    getAdmissionConditionById,
    createAdmissionCondition,
    updateAdmissionCondition,
    AdmissionConditionRequest
} from '../api/admissionConditionApi';
import { getProgramById } from '../api/programApi';
import { ProgramResponse } from '../types';
import ProgramSubjectsTab from "../components/ProgramSubjectsTab";

const AdmissionConditionEditPage = () => {
    const navigate = useNavigate();
    const { programId, conditionId } = useParams<{ programId: string; conditionId?: string }>();
    const isEditMode = !!conditionId;

    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [program, setProgram] = useState<ProgramResponse | null>(null);

    const [formData, setFormData] = useState<AdmissionConditionRequest>({
        year: new Date().getFullYear(),
        passingScore: undefined,
        budgetPlaces: undefined,
        targetedPlaces: undefined,
        paidPlaces: undefined,
        admissionFee: undefined,
        hasDvi: false
    });

    // Загружаем данные программы
    useEffect(() => {
        const loadProgram = async () => {
            if (programId) {
                try {
                    const programData = await getProgramById(parseInt(programId));
                    setProgram(programData);
                } catch (err) {
                    console.error('Ошибка загрузки программы:', err);
                    setError('Не удалось загрузить данные программы');
                }
            }
        };

        loadProgram();
    }, [programId]);

    // Загружаем данные условия поступления при редактировании
    useEffect(() => {
        const loadCondition = async () => {
            if (isEditMode && programId && conditionId) {
                try {
                    setLoading(true);
                    setError(null);

                    const condition = await getAdmissionConditionById(parseInt(programId), parseInt(conditionId));

                    setFormData({
                        year: condition.year,
                        passingScore: condition.passingScore,
                        budgetPlaces: condition.budgetPlaces,
                        targetedPlaces: condition.targetedPlaces,
                        paidPlaces: condition.paidPlaces,
                        admissionFee: condition.admissionFee,
                        hasDvi: condition.hasDvi || false
                    });
                } catch (err) {
                    console.error('Ошибка загрузки условия поступления:', err);
                    setError('Не удалось загрузить данные условия поступления');
                } finally {
                    setLoading(false);
                }
            }
        };

        if (program) {
            loadCondition();
        }
    }, [isEditMode, programId, conditionId, program]);

    // Обработчик изменения полей формы
    const handleInputChange = (field: keyof AdmissionConditionRequest, value: number | boolean | undefined) => {
        setSaveError(null);
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Валидация формы
    const validateForm = (): string | null => {
        if (!formData.year) {
            return 'Укажите год';
        }

        // Проверяем, что год не существует уже для этой программы
        if (program && !isEditMode) {
            const yearExists = program.admissionConditions.some(ac => ac.year === formData.year);
            if (yearExists) {
                return `Условие поступления для ${formData.year} года уже существует`;
            }
        }

        // Если редактируем, проверяем что год не совпадает с другими условиями
        if (program && isEditMode && conditionId) {
            const yearExists = program.admissionConditions.some(
                ac => ac.year === formData.year && ac.id !== parseInt(conditionId)
            );
            if (yearExists) {
                return `Условие поступления для ${formData.year} года уже существует`;
            }
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

        if (!programId) {
            setSaveError('ID программы не указан');
            return;
        }

        try {
            setSaving(true);
            setSaveError(null);

            if (isEditMode && conditionId) {
                await updateAdmissionCondition(parseInt(programId), parseInt(conditionId), formData);
            } else {
                await createAdmissionCondition(parseInt(programId), formData);
            }

            // Перенаправляем обратно на страницу редактирования программы
            navigate(`/program/edit/${programId}`);
        } catch (err: any) {
            console.error('Ошибка сохранения условия поступления:', err);

            let errorMessage = `Не удалось ${isEditMode ? 'обновить' : 'создать'} условие поступления`;

            if (err.response?.status === 403) {
                errorMessage = 'Доступ запрещен. У вас недостаточно прав для выполнения этой операции.';
            } else if (err.response?.status === 400) {
                errorMessage = err.response.data || errorMessage;
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
        navigate(`/program/edit/${programId}`);
    };

    if (loading) {
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
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>{isEditMode ? 'Редактирование условий поступления' : 'Добавление условий поступления'}</h2>
                    {program && (
                        <p className="text-muted mb-0">
                            Программа: {program.specialty.name} ({program.specialty.programCode})
                        </p>
                    )}
                </div>
                <Button variant="secondary" onClick={handleCancel}>
                    ← Назад
                </Button>
            </div>

            <Tabs
                id="admission-condition-tabs"
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'info')}
                className="mb-3"
            >
                {/* Вкладка: Основная информация */}
                <Tab eventKey="info" title="Основная информация">
                    <Card>
                        <Card.Body>
                            <Form>
                                {/* Год */}
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Год *</strong></Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.year}
                                                onChange={(e) => handleInputChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                                                required
                                                min={2000}
                                                max={2100}
                                            />
                                            <Form.Text className="text-muted">
                                                Укажите год набора
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Стоимость поступления</strong></Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.admissionFee || ''}
                                                onChange={(e) => handleInputChange('admissionFee', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                placeholder="Например: 250000"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Проходной балл и ДВИ */}
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Проходной балл</strong></Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.passingScore || ''}
                                                onChange={(e) => handleInputChange('passingScore', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                placeholder="Например: 250"
                                                step="0.01"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Наличие ДВИ</strong></Form.Label>
                                            <div className="mt-2">
                                                <Form.Check
                                                    type="checkbox"
                                                    id="hasDvi"
                                                    label="Требуется дополнительное вступительное испытание (ДВИ)"
                                                    checked={formData.hasDvi}
                                                    onChange={(e) => handleInputChange('hasDvi', e.target.checked)}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Количество мест */}
                                <Row className="mb-3">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label><strong>Бюджетные места</strong></Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.budgetPlaces || ''}
                                                onChange={(e) => handleInputChange('budgetPlaces', e.target.value ? parseInt(e.target.value) : undefined)}
                                                placeholder="Например: 25"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label><strong>Целевые места</strong></Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.targetedPlaces || ''}
                                                onChange={(e) => handleInputChange('targetedPlaces', e.target.value ? parseInt(e.target.value) : undefined)}
                                                placeholder="Например: 5"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label><strong>Платные места</strong></Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.paidPlaces || ''}
                                                onChange={(e) => handleInputChange('paidPlaces', e.target.value ? parseInt(e.target.value) : undefined)}
                                                placeholder="Например: 50"
                                            />
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
                                                    isEditMode ? 'Сохранить изменения' : 'Создать условие'
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

                {/* Вкладка: Предметы */}
                {isEditMode && conditionId && programId && (
                    <Tab eventKey="subjects" title="Предметы">
                        <ProgramSubjectsTab
                            programId={parseInt(programId)}
                            admissionConditionId={parseInt(conditionId)}
                            year={formData.year}
                        />
                    </Tab>
                )}

                {!isEditMode && (
                    <Tab eventKey="subjects" title="Предметы" disabled>
                        <Card>
                            <Card.Body>
                                <Alert variant="info">
                                    Сначала необходимо сохранить условия поступления, затем можно будет добавить предметы.
                                </Alert>
                            </Card.Body>
                        </Card>
                    </Tab>
                )}
            </Tabs>
        </Container>
    );
};

export default AdmissionConditionEditPage;

