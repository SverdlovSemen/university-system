import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createFaculty, updateFaculty, getFacultyById, getFacultiesByUniversity } from '../api/facultyApi';
import { FacultyRequest, FacultyResponse } from '../types';

const FacultyEditPage = () => {
    const navigate = useNavigate();
    const { facultyId } = useParams<{ facultyId?: string }>();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    const isEditMode = !!facultyId;
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
    const [existingFaculties, setExistingFaculties] = useState<FacultyResponse[]>([]);

    const [formData, setFormData] = useState<FacultyRequest>({
        fullName: '',
        abbreviation: '',
        universityId: 0,
        deanName: '',
        deanContacts: '',
        address: '',
        email: '',
        phone: ''
    });

    // Загружаем данные факультета при редактировании
    useEffect(() => {
        const loadFaculty = async () => {
            if (isEditMode && facultyId) {
                try {
                    setLoading(true);
                    setError(null);

                    const faculty = await getFacultyById(parseInt(facultyId));

                    setFormData({
                        fullName: faculty.fullName || '',
                        abbreviation: faculty.abbreviation || '',
                        universityId: faculty.universityId || user?.universityIds?.[0] || 0,
                        deanName: faculty.deanName || '',
                        deanContacts: faculty.deanContacts || '',
                        address: faculty.address || '',
                        email: faculty.email || '',
                        phone: faculty.phone || ''
                    });
                } catch (err) {
                    console.error('Ошибка загрузки факультета:', err);
                    setError('Не удалось загрузить данные факультета');
                } finally {
                    setLoading(false);
                }
            } else {
                // При создании нового факультета устанавливаем ID университета
                setFormData(prev => ({
                    ...prev,
                    universityId: user?.universityIds?.[0] || 0
                }));
            }
        };

        if (user) {
            loadFaculty();
        }
    }, [isEditMode, facultyId, user]);

    // Загружаем все факультеты университета для проверки уникальности
    useEffect(() => {
        const loadExistingFaculties = async () => {
            const universityId = user?.universityIds?.[0];
            if (universityId) {
                try {
                    const faculties = await getFacultiesByUniversity(universityId);
                    setExistingFaculties(faculties);
                } catch (err) {
                    console.error('Ошибка загрузки списка факультетов:', err);
                    // Не показываем ошибку пользователю, т.к. это не критично
                }
            }
        };

        if (user) {
            loadExistingFaculties();
        }
    }, [user]);

    // Обработчик изменения полей формы
    const handleInputChange = (field: keyof FacultyRequest, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setSaveError(null);
        // Очищаем ошибку для конкретного поля при вводе
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Обработчик ввода телефона с форматированием
    const handlePhoneChange = (value: string) => {
        // Удаляем все нецифровые символы
        const digits = value.replace(/\D/g, '');

        // Ограничиваем длину до 11 цифр (российский формат)
        const truncated = digits.slice(0, 11);

        // Форматируем номер
        let formatted = '';
        if (truncated.length > 0) {
            formatted = '+7';
            if (truncated.length > 1) {
                formatted += ' (' + truncated.slice(1, 4);
                if (truncated.length > 4) {
                    formatted += ') ' + truncated.slice(4, 7);
                    if (truncated.length > 7) {
                        formatted += '-' + truncated.slice(7, 9);
                        if (truncated.length > 9) {
                            formatted += '-' + truncated.slice(9, 11);
                        }
                    }
                }
            }
        }

        setFormData(prev => ({
            ...prev,
            phone: formatted
        }));
        setSaveError(null);
        if (fieldErrors.phone) {
            setFieldErrors(prev => ({
                ...prev,
                phone: ''
            }));
        }
    };

    // Валидация формы
    const validateForm = (): boolean => {
        const errors: {[key: string]: string} = {};
        let hasErrors = false;

        // Валидация полного названия
        if (!formData.fullName.trim()) {
            errors.fullName = 'Полное название факультета обязательно для заполнения';
            hasErrors = true;
        } else if (formData.fullName.trim().length > 100) {
            errors.fullName = 'Полное название не должно превышать 100 символов';
            hasErrors = true;
        } else {
            // Проверка на наличие хотя бы одной буквы (русской или английской)
            const hasLetter = /[а-яёА-ЯЁa-zA-Z]/.test(formData.fullName);
            if (!hasLetter) {
                errors.fullName = 'Полное название должно содержать хотя бы одну букву';
                hasErrors = true;
            }

            // Проверка на недопустимые специальные символы
            const hasInvalidChars = /[%$@#&*<>{}[\]\\|`~^]/.test(formData.fullName);
            if (hasInvalidChars) {
                errors.fullName = 'Полное название содержит недопустимые символы';
                hasErrors = true;
            }

            // Проверка на уникальность полного названия
            if (!hasErrors) {
                const duplicateByFullName = existingFaculties.find(f =>
                    f.fullName.toLowerCase() === formData.fullName.trim().toLowerCase() &&
                    (!isEditMode || f.id !== parseInt(facultyId!))
                );
                if (duplicateByFullName) {
                    errors.fullName = 'Факультет с таким полным названием уже существует в этом университете';
                    hasErrors = true;
                }
            }
        }

        // Валидация аббревиатуры (обязательное поле)
        if (!formData.abbreviation || !formData.abbreviation.trim()) {
            errors.abbreviation = 'Аббревиатура факультета обязательна для заполнения';
            hasErrors = true;
        } else if (formData.abbreviation.trim().length > 20) {
            errors.abbreviation = 'Аббревиатура не должна превышать 20 символов';
            hasErrors = true;
        } else {
            // Проверка на наличие хотя бы одной буквы (русской или английской)
            const hasLetter = /[а-яёА-ЯЁa-zA-Z]/.test(formData.abbreviation);
            if (!hasLetter) {
                errors.abbreviation = 'Аббревиатура должна содержать хотя бы одну букву';
                hasErrors = true;
            }

            // Проверка на недопустимые специальные символы
            const hasInvalidChars = /[%$@#&*<>{}[\]\\|`~^]/.test(formData.abbreviation);
            if (hasInvalidChars) {
                errors.abbreviation = 'Аббревиатура содержит недопустимые символы';
                hasErrors = true;
            }

            // Проверка на уникальность аббревиатуры
            if (!hasErrors) {
                const duplicateByAbbreviation = existingFaculties.find(f =>
                    f.abbreviation?.toLowerCase() === formData.abbreviation?.trim().toLowerCase() &&
                    (!isEditMode || f.id !== parseInt(facultyId!))
                );
                if (duplicateByAbbreviation) {
                    errors.abbreviation = 'Факультет с такой аббревиатурой уже существует в этом университете';
                    hasErrors = true;
                }
            }
        }

        // Валидация email если указан
        if (formData.email && formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                errors.email = 'Некорректный формат email';
                hasErrors = true;
            }
        }

        // Валидация телефона если указан
        if (formData.phone && formData.phone.trim()) {
            const phoneDigits = formData.phone.replace(/\D/g, '');
            if (phoneDigits.length > 0 && phoneDigits.length !== 11) {
                errors.phone = 'Телефон должен содержать 11 цифр';
                hasErrors = true;
            }
        }

        if (!formData.universityId || formData.universityId === 0) {
            errors.universityId = 'ID университета отсутствует';
            hasErrors = true;
        }

        setFieldErrors(errors);
        return !hasErrors;
    };

    // Обработчик сохранения
    const handleSave = async () => {
        if (!validateForm()) {
            setSaveError('Проверьте правильность заполнения полей');
            return;
        }

        try {
            setSaving(true);
            setSaveError(null);

            // Подготавливаем данные для отправки (убираем пустые строки)
            const requestData: FacultyRequest = {
                fullName: formData.fullName.trim(),
                abbreviation: formData.abbreviation?.trim() || undefined,
                universityId: formData.universityId,
                deanName: formData.deanName?.trim() || undefined,
                deanContacts: formData.deanContacts?.trim() || undefined,
                address: formData.address?.trim() || undefined,
                email: formData.email?.trim() || undefined,
                phone: formData.phone?.trim() || undefined
            };

            if (isEditMode && facultyId) {
                await updateFaculty(parseInt(facultyId), requestData);
            } else {
                await createFaculty(requestData);
            }

            // Перенаправляем обратно на страницу администрирования университета с открытой вкладкой "Факультеты"
            navigate('/university-admin?tab=faculties');
        } catch (err: any) {
            console.error('Ошибка сохранения факультета:', err);

            let errorMessage = `Не удалось ${isEditMode ? 'обновить' : 'создать'} факультет`;

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
        navigate('/university-admin?tab=faculties');
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
                <h2>{isEditMode ? 'Редактирование факультета' : 'Добавление факультета'}</h2>
                <Button variant="secondary" onClick={handleCancel}>
                    ← Назад
                </Button>
            </div>

            <Card>
                <Card.Body>
                    <Form>
                        {/* Полное название */}
                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label><strong>Полное название *</strong></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                                        placeholder="Введите полное название факультета"
                                        maxLength={100}
                                        required
                                        isInvalid={!!fieldErrors.fullName}
                                        onKeyDown={(e) => {
                                            if (/[%$@#&*<>{}[\]\\|`~^]/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    {fieldErrors.fullName && (
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors.fullName}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Аббревиатура */}
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Аббревиатура *</strong></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.abbreviation}
                                        onChange={(e) => handleInputChange('abbreviation', e.target.value)}
                                        placeholder="Например: ФИТ, ФЭУП"
                                        maxLength={20}
                                        required
                                        isInvalid={!!fieldErrors.abbreviation}
                                        onKeyDown={(e) => {
                                            if (/[%$@#&*<>{}[\]\\|`~^]/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    {fieldErrors.abbreviation && (
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors.abbreviation}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Декан */}
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Имя декана</strong></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.deanName}
                                        onChange={(e) => handleInputChange('deanName', e.target.value)}
                                        placeholder="Иванов Иван Иванович"
                                        maxLength={100}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Контакты декана</strong></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.deanContacts}
                                        onChange={(e) => handleInputChange('deanContacts', e.target.value)}
                                        placeholder="Дополнительные контакты"
                                        maxLength={100}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Адрес */}
                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label><strong>Адрес</strong></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        placeholder="Адрес факультета"
                                        maxLength={100}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Email и телефон */}
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Email</strong></Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="faculty@university.com"
                                        isInvalid={!!fieldErrors.email}
                                        maxLength={40}
                                    />
                                    {fieldErrors.email && (
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors.email}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Телефон</strong></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        placeholder="+7 (999) 999-99-99"
                                        isInvalid={!!fieldErrors.phone}
                                    />
                                    {fieldErrors.phone && (
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors.phone}
                                        </Form.Control.Feedback>
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
                                            isEditMode ? 'Сохранить изменения' : 'Создать факультет'
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
        </Container>
    );
};

export default FacultyEditPage;
