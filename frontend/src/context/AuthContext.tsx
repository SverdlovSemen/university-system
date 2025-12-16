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
    addFavoriteProgram: (programId: number) => Promise<void>;
    removeFavoriteProgram: (programId: number) => Promise<void>;
    refreshUserProfile: () => Promise<void>;
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

    // Реализация функций для работы с избранным
    const addFavoriteUniversity = useCallback(async (universityId: number) => {
        try {
            console.log(`🚨 ВНИМАНИЕ! addFavoriteUniversity вызвана с universityId: ${universityId}`);
            console.log(`🔍 Текущий пользователь:`, user);

            if (user && user.favoriteUniversities.includes(universityId)) {
                console.log(`⚠️ Университет ${universityId} уже в избранном, пропускаем`);
                return; // Уже добавлен
            }

            console.log(`📡 Отправляем POST запрос для добавления университета ${universityId}`);
            await axios.post(`/api/favorites/university/${universityId}`);

            console.log(`🎉 Университет ${universityId} успешно добавлен в избранное`);

            // Обновляем профиль пользователя с сервера
            if (token) {
                await fetchUserProfile(token);
            }

        } catch (error) {
            console.error('❌ Ошибка добавления университета в избранное:', error);
            if (axios.isAxiosError(error)) {
                console.error('❌ Полная ошибка:', error.response?.data || error.message);
            } else if (error instanceof Error) {
                console.error('❌ Полная ошибка:', error.message);
            }
            throw error;
        }
    }, [user, token, fetchUserProfile]);

    const removeFavoriteUniversity = useCallback(async (universityId: number) => {
        try {
            console.log(`➖ Удаляем из избранного университет ${universityId}`);
            console.log(`🔍 Текущий пользователь:`, user);

            await axios.delete(`/api/favorites/university/${universityId}`);

            console.log(`✅ Университет ${universityId} успешно удалён из избранного`);

            // Обновляем профиль пользователя с сервера
            if (token) {
                await fetchUserProfile(token);
            }
        } catch (error) {
            console.error('❌ Ошибка удаления университета из избранного:', error);
            if (axios.isAxiosError(error)) {
                console.error('❌ Полная ошибка:', error.response?.data || error.message);
            } else if (error instanceof Error) {
                console.error('❌ Полная ошибка:', error.message);
            }
            throw error;
        }
    }, [user, token, fetchUserProfile]);

    // Функции для работы с избранными программами
    const addFavoriteProgram = useCallback(async (programId: number) => {
        try {
            console.log(`➕ Добавляем программу ${programId} в избранное`);
            console.log(`🔍 Текущий пользователь:`, user);

            if (user && user.favoriteSpecialties.includes(programId)) {
                console.log(`⚠️ Программа ${programId} уже в избранном, пропускаем`);
                return; // Уже добавлена
            }

            console.log(`📡 Отправляем POST запрос для добавления программы ${programId}`);
            await axios.post(`/api/favorites/program/${programId}`);

            console.log(`🎉 Программа ${programId} успешно добавлена в избранное`);

            // Обновляем профиль пользователя с сервера
            if (token) {
                await fetchUserProfile(token);
            }

        } catch (error) {
            console.error('❌ Ошибка добавления программы в избранное:', error);
            if (axios.isAxiosError(error)) {
                console.error('❌ Полная ошибка:', error.response?.data || error.message);
            } else if (error instanceof Error) {
                console.error('❌ Полная ошибка:', error.message);
            }
            throw error;
        }
    }, [user, token, fetchUserProfile]);

    const removeFavoriteProgram = useCallback(async (programId: number) => {
        try {
            console.log(`➖ Удаляем из избранного программу ${programId}`);
            console.log(`🔍 Текущий пользователь:`, user);

            await axios.delete(`/api/favorites/program/${programId}`);

            console.log(`✅ Программа ${programId} успешно удалена из избранного`);

            // Обновляем профиль пользователя с сервера
            if (token) {
                await fetchUserProfile(token);
            }
        } catch (error) {
            console.error('❌ Ошибка удаления программы из избранного:', error);
            if (axios.isAxiosError(error)) {
                console.error('❌ Полная ошибка:', error.response?.data || error.message);
            } else if (error instanceof Error) {
                console.error('❌ Полная ошибка:', error.message);
            }
            throw error;
        }
    }, [user, token, fetchUserProfile]);

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
        addFavoriteProgram,
        removeFavoriteProgram,
        refreshUserProfile
    };


    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};