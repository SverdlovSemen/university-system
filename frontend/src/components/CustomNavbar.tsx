import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CustomNavbar = () => {
    const { user, isAuthenticated, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <Navbar bg="light" expand="lg" className="mb-4">
            <Container>
                <Navbar.Brand as={Link} to="/">University System</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {/* Поиск университетов и специальностей не показываем для ROLE_ADMIN и ROLE_UNIVERSITY_ADMIN */}
                        {!hasRole('ROLE_ADMIN') && !hasRole('ROLE_UNIVERSITY_ADMIN') && (
                            <>
                                <Nav.Link as={Link} to="/">Поиск университетов</Nav.Link>
                                <Nav.Link as={Link} to="/specialty-search">Поиск специальностей</Nav.Link>
                            </>
                        )}
                        {isAuthenticated && hasRole('ROLE_ADMIN') && (
                            <Nav.Link as={Link} to="/admin-page">Панель ADMIN</Nav.Link>
                        )}
                    </Nav>

                    <Nav>
                        {isAuthenticated ? (
                            <>
                                <Navbar.Text className="me-3">
                                    Привет, {user?.firstName}!
                                </Navbar.Text>
                                {/* Кнопка "Профиль" не показывается для ROLE_ADMIN и ROLE_UNIVERSITY_ADMIN */}
                                {!hasRole('ROLE_ADMIN') && !hasRole('ROLE_UNIVERSITY_ADMIN') && (
                                    <Button
                                        variant="outline-secondary"
                                        className="me-2"
                                        onClick={() => navigate('/profile')}
                                    >
                                        Профиль
                                    </Button>
                                )}
                                <Button
                                    variant="outline-danger"
                                    onClick={handleLogout}
                                >
                                    Выйти
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline-primary"
                                    className="me-2"
                                    onClick={() => navigate('/login')}
                                >
                                    Войти
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/register')}
                                >
                                    Регистрация
                                </Button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default CustomNavbar;