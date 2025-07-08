import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import EditorDashboard from './pages/EditorDashboard';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute: React.FC<{
    children: React.ReactNode,
    roles?: string[]
}> = ({ children, roles }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && roles.length > 0) {
        if (!user?.roles?.some(role => roles.includes(role))) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

const AppRouter = () => {
    return (
        <Routes>
            {/* Основная страница - поиск (доступна всем) */}
            <Route path="/" element={<SearchPage />} />

            {/* Страницы аутентификации */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Защищенные маршруты */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute roles={['ROLE_ADMIN']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/editor"
                element={
                    <ProtectedRoute roles={['ROLE_EDITOR']}>
                        <EditorDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Перенаправление для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRouter;