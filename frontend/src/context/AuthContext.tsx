// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';

// Обновленный интерфейс User
interface User {
    id: number;
    username: string;  // Это будет email на самом деле
    firstName: string; // Добавляем это поле
    roles: string[];
    favoriteUniversities: number[];
    favoriteSpecialties: number[];
        universityIds?: number[]; // университеты, в которых пользователь является сотрудником
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>; // Принимает email
    register: (email: string, firstName: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    hasRole: (role: string) => boolean;
    addFavoriteUniversity: (universityId: number) => Promise<void>;
    removeFavoriteUniversity: (universityId: number) => Promise<void>;
    addFavoriteSpecialty: (specialtyId: number) => Promise<void>;
    removeFavoriteSpecialty: (specialtyId: number) => Promise<void>;
    refreshUserProfile: () => Promise<void>; // Добавляем если нужно
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    const fetchUserProfile = useCallback(async (token: string) => {
        try {
            // Делаем реальный запрос к серверу за профилем
            const response = await axios.get('/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const profileData = response.data;
            console.log('Profile data from server:', profileData); // Для отладки

            // Преобразуем ответ сервера
            const userData: User = {
                id: profileData.id,
                username: profileData.email, // Используем email как username
                firstName: profileData.firstName, // РЕАЛЬНОЕ ИМЯ!
                roles: profileData.roles,
                favoriteUniversities: profileData.favoriteUniversities || [],
                favoriteSpecialties: profileData.favoriteSpecialties || []
                ,
                universityIds: profileData.universityIds || []
            };

            setUser(userData);
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            // Если не удалось загрузить профиль, создаем временного пользователя
            const tempUser: User = {
                id: Date.now(),
                username: 'user@example.com',
                firstName: 'Пользователь', // Только как fallback
                roles: ['ROLE_USER'],
                favoriteUniversities: [],
                favoriteSpecialties: []
            };
            setUser(tempUser);
        }
    }, [logout]);

    useEffect(() => {
        const verifyAuth = async () => {
            if (token) {
                await fetchUserProfile(token);
            }
            setLoading(false);
        };

        verifyAuth();
    }, [token, fetchUserProfile]);

    // Ensure axios includes Authorization header for subsequent requests
    useEffect(() => {
        if (token) {
            if (axios && axios.defaults && axios.defaults.headers) {
                axios.defaults.headers.common = axios.defaults.headers.common || {};
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
        } else {
            try {
                if (axios && axios.defaults && axios.defaults.headers && axios.defaults.headers.common) {
                    delete axios.defaults.headers.common['Authorization'];
                }
            } catch (e) {
                // ignore
            }
        }
    }, [token]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            const token = response.data.token;

            localStorage.setItem('token', token);
            setToken(token);

            // Загружаем РЕАЛЬНЫЙ профиль с сервера
            await fetchUserProfile(token);

        } catch (error) {
            console.error('Login failed', error);
            throw new Error('Неверный email или пароль');
        }
    }, [fetchUserProfile]);

    const register = useCallback(async (email: string, firstName: string, password: string) => {
        try {
            await axios.post('/api/auth/register', { email, firstName, password });
            // После регистрации автоматически логинимся
            await login(email, password);
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    }, [login]);

    const isAuthenticated = !!user;

    const hasRole = useCallback((requiredRole: string): boolean => {
        return user?.roles?.includes(requiredRole) ?? false;
    }, [user]);

    // Заглушки для избранного (пока не реализованы)
    const addFavoriteUniversity = useCallback(async (universityId: number) => {
        console.log('addFavoriteUniversity not implemented');
    }, []);

    const removeFavoriteUniversity = useCallback(async (universityId: number) => {
        console.log('removeFavoriteUniversity not implemented');
    }, []);

    const addFavoriteSpecialty = useCallback(async (specialtyId: number) => {
        console.log('addFavoriteSpecialty not implemented');
    }, []);

    const removeFavoriteSpecialty = useCallback(async (specialtyId: number) => {
        console.log('removeFavoriteSpecialty not implemented');
    }, []);

    const refreshUserProfile = useCallback(async () => {
        if (token) {
            await fetchUserProfile(token);
        }
    }, [token, fetchUserProfile]);

    const contextValue: AuthContextType = {
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated,
        loading,
        hasRole,
        addFavoriteUniversity,
        removeFavoriteUniversity,
        addFavoriteSpecialty,
        removeFavoriteSpecialty,
        refreshUserProfile
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};