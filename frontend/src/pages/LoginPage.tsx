import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Form, Container, Card, Alert } from 'react-bootstrap';

const LoginPage = () => {
    const [email, setEmail] = useState(''); // Изменено с username на email
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password); // Передаем email вместо username

            // Перенаправляем в зависимости от роли
            // Используем setTimeout чтобы дать время контексту обновиться
            setTimeout(() => {
                const storedToken = localStorage.getItem('token');
                if (storedToken) {
                    // Проверяем роли из локального хранилища или контекста
                    fetch('/api/auth/profile', {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    })
                    .then(res => res.json())
                    .then(profile => {
                        if (profile.roles?.includes('ROLE_ADMIN')) {
                            navigate('/admin-page');
                        } else if (profile.roles?.includes('ROLE_UNIVERSITY_ADMIN')) {
                            navigate('/university-admin');
                        } else if (profile.roles?.includes('ROLE_EDITOR')) {
                            navigate('/editor');
                        } else {
                            navigate('/');
                        }
                    })
                    .catch(() => navigate('/'));
                } else {
                    navigate('/');
                }
            }, 100);
        } catch (err) {
            setError('Неверное имя пользователя или пароль');
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '400px' }}>
                <Card.Body>
                    <Card.Title className="text-center mb-4">Вход в систему</Card.Title>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label> {/* Изменено с "Имя пользователя" */}
                            <Form.Control
                                type="email" // Изменено с text на email
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Пароль</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100 mb-3">
                            Войти
                        </Button>

                        <Button
                            variant="link"
                            className="w-100"
                            onClick={() => navigate('/register')}
                        >
                            Зарегистрироваться
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default LoginPage;