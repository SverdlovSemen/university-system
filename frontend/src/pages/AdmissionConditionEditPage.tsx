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
    const [yearError, setYearError] = useState<string | null>(null);
    const [passingScoreError, setPassingScoreError] = useState<string | null>(null);
    const [budgetPlacesError, setBudgetPlacesError] = useState<string | null>(null);
    const [targetedPlacesError, setTargetedPlacesError] = useState<string | null>(null);
    const [paidPlacesError, setPaidPlacesError] = useState<string | null>(null);

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

        // Валидация года при изменении
        if (field === 'year' && typeof value === 'number') {
            validateYear(value);
        }

        // Валидация проходного балла при изменении
        if (field === 'passingScore') {
            if (value === undefined) {
                setPassingScoreError(null);
            } else if (typeof value === 'number') {
                validatePassingScore(value);
            }
        }

        // Валидация бюджетных мест
        if (field === 'budgetPlaces') {
            if (value === undefined) {
                setBudgetPlacesError(null);
            } else if (typeof value === 'number') {
                validatePlaces(value, 'budgetPlaces');
            }
        }

        // Валидация целевых мест
        if (field === 'targetedPlaces') {
            if (value === undefined) {
                setTargetedPlacesError(null);
            } else if (typeof value === 'number') {
                validatePlaces(value, 'targetedPlaces');
            }
        }

        // Валидация платных мест
        if (field === 'paidPlaces') {
            if (value === undefined) {
                setPaidPlacesError(null);
            } else if (typeof value === 'number') {
                validatePlaces(value, 'paidPlaces');
            }
        }
    };

    // Валидация года
    const validateYear = (year: number): boolean => {
        const currentYear = new Date().getFullYear();
        const minYear = 2009;

        // Проверка диапазона
        if (year < minYear || year > currentYear) {
            setYearError(`Год должен быть от ${minYear} до ${currentYear}`);
            return false;
        }

        // Проверка на дублирование года
        if (program) {
            if (!isEditMode) {
                // Режим создания: проверяем, что год не существует
                const yearExists = program.admissionConditions.some(ac => ac.year === year);
                if (yearExists) {
                    setYearError(`Условие поступления для ${year} года уже существует`);
                    return false;
                }
            } else if (conditionId) {
                // Режим редактирования: проверяем, что год не совпадает с другими условиями
                const yearExists = program.admissionConditions.some(
                    ac => ac.year === year && ac.id !== parseInt(conditionId)
                );
                if (yearExists) {
                    setYearError(`Условие поступления для ${year} года уже существует`);
                    return false;
                }
            }
        }

        setYearError(null);
        return true;
    };

    // Валидация проходного балла
    const validatePassingScore = (score: number): boolean => {
        const minScore = 0;
        const maxScore = 100;

        // Проверка диапазона
        if (score < minScore || score > maxScore) {
            setPassingScoreError(`Проходной балл должен быть от ${minScore} до ${maxScore}`);
            return false;
        }

        setPassingScoreError(null);
        return true;
    };

    // Валидация количества мест
    const validatePlaces = (places: number, field: 'budgetPlaces' | 'targetedPlaces' | 'paidPlaces'): boolean => {
        const minPlaces = 0;
        const maxPlaces = 500;

        const fieldNames = {
            budgetPlaces: 'Бюджетные места',
            targetedPlaces: 'Целевые места',
            paidPlaces: 'Платные места'
        };

        const fieldName = fieldNames[field];

        // Проверка на положительное число
        if (places < minPlaces) {
            const setError = field === 'budgetPlaces' ? setBudgetPlacesError :
                            field === 'targetedPlaces' ? setTargetedPlacesError :
                            setPaidPlacesError;
            setError(`${fieldName} должны быть положительным числом`);
            return false;
        }

        // Проверка диапазона
        if (places > maxPlaces) {
            const setError = field === 'budgetPlaces' ? setBudgetPlacesError :
                            field === 'targetedPlaces' ? setTargetedPlacesError :
                            setPaidPlacesError;
            setError(`${fieldName} не могут превышать ${maxPlaces}`);
            return false;
        }

        // Сброс ошибки для соответствующего поля
        if (field === 'budgetPlaces') {
            setBudgetPlacesError(null);
        } else if (field === 'targetedPlaces') {
            setTargetedPlacesError(null);
        } else if (field === 'paidPlaces') {
            setPaidPlacesError(null);
        }

        return true;
    };

    // Валидация формы
    const validateForm = (): string | null => {
        if (!formData.year) {
            return 'Укажите год';
        }

        // Используем существующую валидацию года
        if (!validateYear(formData.year)) {
            return yearError;
        }

        // Валидация проходного балла
        if (formData.passingScore !== undefined && !validatePassingScore(formData.passingScore)) {
            return passingScoreError;
        }

        // Валидация бюджетных мест
        if (formData.budgetPlaces !== undefined && !validatePlaces(formData.budgetPlaces, 'budgetPlaces')) {
            return budgetPlacesError;
        }

        // Валидация целевых мест
        if (formData.targetedPlaces !== undefined && !validatePlaces(formData.targetedPlaces, 'targetedPlaces')) {
            return targetedPlacesError;
        }

        // Валидация платных мест
        if (formData.paidPlaces !== undefined && !validatePlaces(formData.paidPlaces, 'paidPlaces')) {
            return paidPlacesError;
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

            // Перенаправляем обратно на страницу редактирования программы на вкладку "Условия поступления"
            navigate(`/program/edit/${programId}?tab=admission`);
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
        navigate(`/program/edit/${programId}?tab=admission`);
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
                                                min={2009}
                                                max={new Date().getFullYear()}
                                                isInvalid={!!yearError}
                                                onKeyDown={(e) => {
                                                    // Разрешаем только цифры, Backspace, Delete, Tab, Arrow keys
                                                    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                                                    if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            {yearError ? (
                                                <Form.Control.Feedback type="invalid">
                                                    {yearError}
                                                </Form.Control.Feedback>
                                            ) : (
                                                <Form.Text className="text-muted">
                                                    Укажите год набора (от 2009 до {new Date().getFullYear()})
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Стоимость поступления</strong></Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.admissionFee || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Ограничиваем длину до 10 символов
                                                    if (value.length <= 10) {
                                                        handleInputChange('admissionFee', value ? parseFloat(value) : undefined);
                                                    }
                                                }}
                                                placeholder="Например: 250000"
                                                maxLength={10}
                                                onKeyDown={(e) => {
                                                    // Разрешаем только цифры, Backspace, Delete, Tab, Arrow keys
                                                    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                                                    if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <Form.Text className="text-muted">
                                                Максимум 10 цифр
                                            </Form.Text>
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
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Ограничиваем длину до 5 символов
                                                    if (value.length <= 5) {
                                                        handleInputChange('passingScore', value ? parseFloat(value) : undefined);
                                                    }
                                                }}
                                                placeholder="Например: 50"
                                                maxLength={5}
                                                min={0}
                                                max={100}
                                                isInvalid={!!passingScoreError}
                                                onKeyDown={(e) => {
                                                    // Разрешаем только цифры, точку, Backspace, Delete, Tab, Arrow keys
                                                    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '.'];
                                                    if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            {passingScoreError ? (
                                                <Form.Control.Feedback type="invalid">
                                                    {passingScoreError}
                                                </Form.Control.Feedback>
                                            ) : (
                                                <Form.Text className="text-muted">
                                                    Значение от 0 до 100 (максимум 5 символов)
                                                </Form.Text>
                                            )}
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
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    handleInputChange('budgetPlaces', value ? parseInt(value) : undefined);
                                                }}
                                                placeholder="Например: 25"
                                                min={0}
                                                max={500}
                                                isInvalid={!!budgetPlacesError}
                                                onKeyDown={(e) => {
                                                    // Разрешаем только цифры, Backspace, Delete, Tab, Arrow keys
                                                    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                                                    if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            {budgetPlacesError ? (
                                                <Form.Control.Feedback type="invalid">
                                                    {budgetPlacesError}
                                                </Form.Control.Feedback>
                                            ) : (
                                                <Form.Text className="text-muted">
                                                    От 0 до 500
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label><strong>Целевые места</strong></Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.targetedPlaces || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    handleInputChange('targetedPlaces', value ? parseInt(value) : undefined);
                                                }}
                                                placeholder="Например: 5"
                                                min={0}
                                                max={500}
                                                isInvalid={!!targetedPlacesError}
                                                onKeyDown={(e) => {
                                                    // Разрешаем только цифры, Backspace, Delete, Tab, Arrow keys
                                                    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                                                    if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            {targetedPlacesError ? (
                                                <Form.Control.Feedback type="invalid">
                                                    {targetedPlacesError}
                                                </Form.Control.Feedback>
                                            ) : (
                                                <Form.Text className="text-muted">
                                                    От 0 до 500
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label><strong>Платные места</strong></Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.paidPlaces || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    handleInputChange('paidPlaces', value ? parseInt(value) : undefined);
                                                }}
                                                placeholder="Например: 50"
                                                min={0}
                                                max={500}
                                                isInvalid={!!paidPlacesError}
                                                onKeyDown={(e) => {
                                                    // Разрешаем только цифры, Backspace, Delete, Tab, Arrow keys
                                                    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                                                    if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            {paidPlacesError ? (
                                                <Form.Control.Feedback type="invalid">
                                                    {paidPlacesError}
                                                </Form.Control.Feedback>
                                            ) : (
                                                <Form.Text className="text-muted">
                                                    От 0 до 500
                                                </Form.Text>
                                            )}
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
                                                disabled={saving || !!yearError || !!passingScoreError || !!budgetPlacesError || !!targetedPlacesError || !!paidPlacesError}
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
            </Tabs>
        </Container>
    );
};

export default AdmissionConditionEditPage;

