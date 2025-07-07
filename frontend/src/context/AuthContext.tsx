import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';

// Типы для TypeScript
interface User {
    id: number;
    username: string;
    roles: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

// Создаем контекст с начальным значением null
export const AuthContext = createContext<AuthContextType | null>(null);

// Провайдер контекста
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Проверка аутентификации при загрузке
    useEffect(() => {
        const verifyAuth = async () => {
            if (token) {
                try {
                    // Запрос для проверки токена
                    const response = await axios.get('/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(response.data);
                } catch (error) {
                    console.error('Token verification failed', error);
                    logout();
                }
            }
            setLoading(false);
        };

        verifyAuth();
    }, [token]);

    // Функция входа
    const login = useCallback(async (username: string, password: string) => {
        try {
            const response = await axios.post('/api/auth/login', { username, password });

            // Извлекаем токен из ответа
            const { token } = response.data;

            // Сохраняем токен в localStorage и состоянии
            localStorage.setItem('token', token);
            setToken(token);

            // Получаем данные пользователя
            const userResponse = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(userResponse.data);
        } catch (error) {
            console.error('Login failed', error);
            throw new Error('Неверное имя пользователя или пароль');
        }
    }, []);

    // Функция регистрации
    const register = useCallback(async (username: string, password: string) => {
        try {
            await axios.post('/api/auth/register', { username, password });
            // После регистрации автоматически входим
            await login(username, password);
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    }, [login]);

    // Функция выхода
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        // Здесь можно добавить вызов API для выхода
    }, []);

    // Проверка аутентификации
    const isAuthenticated = !!user;

    // Значение контекста
    const contextValue = {
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated,
        loading
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};