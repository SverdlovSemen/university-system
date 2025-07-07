import React, {JSX} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import { useAuth } from './hooks/useAuth';
import { Spinner } from 'react-bootstrap';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
            </div>
    );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const AppRouter = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route
    path="/"
    element={
        <ProtectedRoute>
        <HomePage />
        </ProtectedRoute>
}
    />

    {/* Сюда будем добавлять другие маршруты */}
    </Routes>
    </Router>
);
};

export default AppRouter;