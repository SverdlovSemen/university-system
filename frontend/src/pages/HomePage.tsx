import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from 'react-bootstrap';

const HomePage = () => {
    const { user, logout } = useAuth();

    return (
        <div className="container mt-4">
            <h1>Добро пожаловать, {user?.username}!</h1>
            <p>Это главная страница приложения University System.</p>

            <Button variant="danger" onClick={logout}>
                Выйти
            </Button>
        </div>
    );
};

export default HomePage;