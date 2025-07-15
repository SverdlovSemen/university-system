// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';

// Обновленный интерфейс User
interface User {
    id: number;
    username: string;
    roles: string[];
    favoriteUniversities: number[];
    favoriteSpecialties: number[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    hasRole: (role: string) => boolean;
    addFavoriteUniversity: (universityId: number) => Promise<void>;
    removeFavoriteUniversity: (universityId: number) => Promise<void>;
    addFavoriteSpecialty: (specialtyId: number) => Promise<void>;
    removeFavoriteSpecialty: (specialtyId: number) => Promise<void>;
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
            const response = await axios.get('/api/profile/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Преобразуем ответ сервера к правильному формату
            const profileData = response.data;
            const userData = {
                id: profileData.id,
                username: profileData.username,
                roles: profileData.roles,
                favoriteUniversities: profileData.favoriteUniversities.map((u: any) => u.id),
                favoriteSpecialties: profileData.favoriteSpecialties.map((s: any) => s.id)
            };

            setUser(userData);
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            logout(); // Теперь logout доступен
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

    const login = useCallback(async (username: string, password: string) => {
        try {
            const response = await axios.post('/api/auth/login', { username, password });
            const token = response.data.token;

            localStorage.setItem('token', token);
            setToken(token);
            await fetchUserProfile(token);
        } catch (error) {
            console.error('Login failed', error);
            throw new Error('Неверное имя пользователя или пароль');
        }
    }, [fetchUserProfile]);

    const register = useCallback(async (username: string, password: string) => {
        try {
            await axios.post('/api/auth/register', { username, password });
            await login(username, password);
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    }, [login]);



    const isAuthenticated = !!user;

    const hasRole = useCallback((requiredRole: string): boolean => {
        return user?.roles?.includes(requiredRole) ?? false;
    }, [user]);

    // Функции для управления избранным
    const addFavoriteUniversity = useCallback(async (universityId: number) => {
        if (!token) return;

        try {
            await axios.post(`/api/favorites/university/${universityId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchUserProfile(token); // Обновляем профиль после изменения
        } catch (error) {
            console.error('Failed to add university to favorites', error);
        }
    }, [token, fetchUserProfile]);

    const removeFavoriteUniversity = useCallback(async (universityId: number) => {
        if (!token) return;

        try {
            await axios.delete(`/api/favorites/university/${universityId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchUserProfile(token); // Обновляем профиль после изменения
        } catch (error) {
            console.error('Failed to remove university from favorites', error);
        }
    }, [token, fetchUserProfile]);

    const addFavoriteSpecialty = useCallback(async (specialtyId: number) => {
        if (!token) return;

        try {
            await axios.post(`/api/favorites/specialty/${specialtyId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchUserProfile(token); // Обновляем профиль после изменения
        } catch (error) {
            console.error('Failed to add specialty to favorites', error);
        }
    }, [token, fetchUserProfile]);

    const removeFavoriteSpecialty = useCallback(async (specialtyId: number) => {
        if (!token) return;

        try {
            await axios.delete(`/api/favorites/specialty/${specialtyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchUserProfile(token); // Обновляем профиль после изменения
        } catch (error) {
            console.error('Failed to remove specialty from favorites', error);
        }
    }, [token, fetchUserProfile]);

    // Функция для принудительного обновления профиля
    const refreshUserProfile = useCallback(async () => {
        if (token) {
            await fetchUserProfile(token);
        }
    }, [token, fetchUserProfile]);

    const contextValue = {
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