import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const UniversityAdminPage = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Container className="mt-4">
            <Button variant="danger" onClick={handleLogout}>
                Выйти
            </Button>
        </Container>
    );
};

export default UniversityAdminPage;

