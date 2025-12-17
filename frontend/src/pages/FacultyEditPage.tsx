import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createFaculty, updateFaculty, getFacultyById } from '../api/facultyApi';
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

    // Обработчик изменения полей формы
    const handleInputChange = (field: keyof FacultyRequest, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setSaveError(null);
    };

    // Валидация формы
    const validateForm = (): string | null => {
        if (!formData.fullName.trim()) {
            return 'Полное название факультета обязательно для заполнения';
        }

        if (!formData.universityId || formData.universityId === 0) {
            return 'ID университета отсутствует';
        }

        // Валидация email если указан
        if (formData.email && formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                return 'Некорректный формат email';
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

            // Перенаправляем обратно на страницу администрирования университета
            navigate('/university-admin');
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
        navigate('/university-admin');
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
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Аббревиатура */}
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Аббревиатура</strong></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.abbreviation}
                                        onChange={(e) => handleInputChange('abbreviation', e.target.value)}
                                        placeholder="Например: ФИТ, ФЭУП"
                                    />
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
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Телефон</strong></Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="+7 (999) 999-99-99"
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
