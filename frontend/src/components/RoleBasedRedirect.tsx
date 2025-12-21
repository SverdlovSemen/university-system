import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Компонент для автоматического перенаправления пользователей
 * на их домашнюю страницу в зависимости от роли
 */
const RoleBasedRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Не перенаправляем, пока идет загрузка
        if (loading) return;

        // Не перенаправляем неавторизованных пользователей
        if (!isAuthenticated || !user) return;

        // Перенаправляем только если пользователь на главной странице
        if (location.pathname !== '/') return;

        // Определяем куда перенаправить в зависимости от роли
        if (user.roles?.includes('ROLE_ADMIN')) {
            navigate('/admin-page', { replace: true });
        } else if (user.roles?.includes('ROLE_UNIVERSITY_ADMIN')) {
            navigate('/university-admin', { replace: true });
        }
        // Обычные пользователи и редакторы остаются на SearchPage
    }, [user, isAuthenticated, loading, location.pathname, navigate]);

    return <>{children}</>;
};

export default RoleBasedRedirect;

