import React, { useState } from 'react';
import { Container, Card, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { createUniversityApplication, UniversityApplicationRequest } from '../api/universityApplicationApi';

const ApplicationPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        abbreviation: '',
        website: '',
        contactPersonName: '',
        contactPersonPosition: '',
        contactEmail: '',
        contactPhone: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Проверяем, что обязательные поля заполнены
            if (!formData.fullName || !formData.contactPersonName || !formData.contactEmail) {
                setError('Пожалуйста, заполните все обязательные поля');
                setIsSubmitting(false);
                return;
            }

            // Формируем запрос
            const request: UniversityApplicationRequest = {
                fullName: formData.fullName,
                abbreviation: formData.abbreviation || undefined,
                website: formData.website || undefined,
                contactPersonName: formData.contactPersonName,
                contactPersonPosition: formData.contactPersonPosition || undefined,
                contactEmail: formData.contactEmail,
                contactPhone: formData.contactPhone || undefined
            };

            // Отправляем заявку
            await createUniversityApplication(request);

            // Перенаправляем на страницу профиля
            navigate('/profile');
        } catch (err: any) {
            console.error('Error creating application:', err);
            setError(err.response?.data?.message || 'Ошибка при отправке заявки. Попробуйте еще раз.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header as="h5" className="bg-primary text-white">
                    Подача заявки на добавление университета
                </Card.Header>
                <Card.Body>
                    <Card.Title>Заявка для администратора университета</Card.Title>
                    <Card.Text className="text-muted mb-4">
                        Заполните форму ниже, чтобы подать заявку на добавление информации о вашем университете в систему.
                    </Card.Text>

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Полное название университета <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Введите полное название университета"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Аббревиатура</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="abbreviation"
                                        value={formData.abbreviation}
                                        onChange={handleChange}
                                        placeholder="Например: МГУ, СПбГУ"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Сайт</Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        placeholder="https://example.com"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr className="my-4" />
                        <h6 className="mb-3">Контактная информация</h6>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Имя контактного лица (ФИО) <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contactPersonName"
                                        value={formData.contactPersonName}
                                        onChange={handleChange}
                                        placeholder="Введите ФИО контактного лица"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Должность контактного лица</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contactPersonPosition"
                                        value={formData.contactPersonPosition}
                                        onChange={handleChange}
                                        placeholder="Например: Проректор по учебной работе"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Почта университета <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleChange}
                                        placeholder="email@university.edu"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Телефон контактного лица</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="contactPhone"
                                        value={formData.contactPhone}
                                        onChange={handleChange}
                                        placeholder="+7 (999) 123-45-67"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-between mt-4">
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/profile')}
                                disabled={isSubmitting}
                            >
                                Назад
                            </Button>
                            <Button
                                variant="success"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Отправка...
                                    </>
                                ) : (
                                    'Отправить заявку'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ApplicationPage;

