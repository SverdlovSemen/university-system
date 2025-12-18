import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Container, Card, Alert } from 'react-bootstrap';
import axios from 'axios';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    // editor self-registration removed; admins will assign editor role
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (!email.includes('@')) {
            setError('Введите корректный email');
            return;
        }

        try {
            await axios.post('/api/auth/register', { email, firstName, password });
            navigate('/login', { state: { message: 'Регистрация успешна! Теперь войдите.' } });
        } catch (err: any) {
            const resp = err?.response?.data;

            // Если пришел объект с message, используем его
            if (resp && typeof resp === 'object' && resp.message) {
                setError(resp.message);
            }
            // Если пришла строка
            else if (typeof resp === 'string') {
                setError(resp);
            }
            // Иначе показываем общую ошибку
            else {
                setError(err.message || 'Ошибка регистрации. Возможно, такой email уже существует.');
            }
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '400px' }}>
                <Card.Body>
                    <Card.Title className="text-center mb-4">Регистрация</Card.Title>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email *</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@mail.com"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Имя *</Form.Label>
                            <Form.Control
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Ваше имя"
                                required
                                minLength={2}
                                maxLength={50}
                            />
                            <Form.Text className="text-muted">
                                От 2 до 50 символов
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Пароль *</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                maxLength={100}
                            />
                            <Form.Text className="text-muted">
                                От 6 до 100 символов
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Подтверждение пароля *</Form.Label>
                            <Form.Control
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        {/* Editor self-registration removed. Администратор может назначать роль редактора через панель администратора. */}

                        <Button variant="primary" type="submit" className="w-100 mb-3">
                            Зарегистрироваться
                        </Button>

                        <Button
                            variant="link"
                            className="w-100"
                            onClick={() => navigate('/login')}
                        >
                            Уже есть аккаунт? Войти
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RegisterPage;