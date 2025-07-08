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
    hasRole: (role: string) => boolean; // Добавлено
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            if (token) {
                try {
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

    const login = useCallback(async (username: string, password: string) => {
        try {
            const response = await axios.post('/api/auth/login', { username, password });
            const token = response.data.token;

            localStorage.setItem('token', token);
            setToken(token);

            const userResponse = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(userResponse.data);
        } catch (error) {
            console.error('Login failed', error);
            throw new Error('Неверное имя пользователя или пароль');
        }
    }, []);

    const register = useCallback(async (username: string, password: string) => {
        try {
            await axios.post('/api/auth/register', { username, password });
            await login(username, password);
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    }, [login]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    const isAuthenticated = !!user;

    // Новая функция для проверки ролей
    const hasRole = useCallback((requiredRole: string): boolean => {
        return user?.roles?.includes(requiredRole) ?? false;
    }, [user]);

    const contextValue = {
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated,
        loading,
        hasRole // Добавлено
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};