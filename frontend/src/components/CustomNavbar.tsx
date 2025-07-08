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
                        <Nav.Link as={Link} to="/">Поиск</Nav.Link>
                        {isAuthenticated && hasRole('ROLE_ADMIN') && (
                            <Nav.Link as={Link} to="/admin">Админ-панель</Nav.Link>
                        )}
                        {isAuthenticated && hasRole('ROLE_EDITOR') && (
                            <Nav.Link as={Link} to="/editor">Редактор</Nav.Link>
                        )}
                    </Nav>

                    <Nav>
                        {isAuthenticated ? (
                            <>
                                <Navbar.Text className="me-3">
                                    Привет, {user?.username}!
                                </Navbar.Text>
                                <Button
                                    variant="outline-secondary"
                                    className="me-2"
                                    onClick={() => navigate('/')}
                                >
                                    Профиль
                                </Button>
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