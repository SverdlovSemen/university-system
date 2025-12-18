import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import EditorUniversityPage from './pages/EditorUniversityPage';
import AdminApplicationPage from './pages/AdminApplicationPage';
import UniversityEditorsPage from './pages/UniversityEditorsPage';
import { useAuth } from './hooks/useAuth';
import UniversityPage from './pages/UniversityPage';
import ProgramPage from './pages/ProgramPage';
import SpecialtySearchPage from './pages/SpecialtySearchPage';
import SpecialtyPage from './pages/SpecialtyPage';
import UserProfilePage from "./pages/UserProfilePage";
import FacultyPage from './pages/FacultyPage';
import ApplicationPage from './pages/ApplicationPage';
import UniversityAdminPage from './pages/UniversityAdminPage';
import UniversityAdminUsersPage from './pages/UniversityAdminUsersPage';
import FacultyEditPage from "./pages/FacultyEditPage";
import ProgramEditPage from "./pages/ProgramEditPage";
import AdmissionConditionEditPage from "./pages/AdmissionConditionEditPage";

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
            {/* Основная страница - поиск университетов (доступна всем) */}
            <Route path="/" element={<SearchPage />} />

            {/* Страница университета (доступна всем) */}
            <Route path="/university/:id" element={<UniversityPage />} />
            {/* Страница программы конкретного университета */}
            <Route path="/university/:universityId/program/:programId" element={<ProgramPage />} />

            {/* Новая страница поиска специальностей (доступна всем) */}
            <Route path="/specialty-search" element={<SpecialtySearchPage />} />

            {/* Страница специальности (доступна всем) */}
            <Route path="/specialty/:id" element={<SpecialtyPage />} />

            {/* Страницы аутентификации */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Страница факультета */}
            <Route path="/faculty/:id" element={<FacultyPage />} />
            {/*Профиль обычного пользователя*/}
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <UserProfilePage />
                    </ProtectedRoute>
                }
            />

            {/* Страница подачи заявки */}
            <Route
                path="/application"
                element={
                    <ProtectedRoute>
                        <ApplicationPage />
                    </ProtectedRoute>
                }
            />

            {/* Защищенные маршруты */}
            {/* Страница администратора сайта (только ROLE_ADMIN) */}
            <Route
                path="/admin-page"
                element={
                    <ProtectedRoute roles={['ROLE_ADMIN']}>
                        <AdminPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/applications"
                element={
                    <ProtectedRoute roles={['ROLE_ADMIN']}>
                        <AdminApplicationPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/editor/university"
                element={
                    <ProtectedRoute roles={['ROLE_EDITOR','ROLE_UNIVERSITY_ADMIN']}>
                        <EditorUniversityPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/university-admin"
                element={
                    <ProtectedRoute roles={['ROLE_UNIVERSITY_ADMIN']}>
                        <UniversityAdminPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/university-admin/users"
                element={
                    <ProtectedRoute roles={['ROLE_UNIVERSITY_ADMIN']}>
                        <UniversityAdminUsersPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/university-admin/editors"
                element={
                    <ProtectedRoute roles={['ROLE_UNIVERSITY_ADMIN']}>
                        <UniversityEditorsPage />
                    </ProtectedRoute>
                }
            />

            {/* Создание нового факультета */}
            <Route
                path="/faculty/new"
                element={
                    <ProtectedRoute roles={['ROLE_UNIVERSITY_ADMIN']}>
                        <FacultyEditPage />
                    </ProtectedRoute>
                }
            />

            {/* Редактирование существующего факультета */}
            <Route
                path="/faculty/edit/:facultyId"
                element={
                    <ProtectedRoute roles={['ROLE_UNIVERSITY_ADMIN']}>
                        <FacultyEditPage />
                    </ProtectedRoute>
                }
            />

            {/* Создание новой программы */}
            <Route
                path="/program/new"
                element={
                    <ProtectedRoute roles={['ROLE_UNIVERSITY_ADMIN']}>
                        <ProgramEditPage />
                    </ProtectedRoute>
                }
            />

            {/* Редактирование существующей программы */}
            <Route
                path="/program/edit/:programId"
                element={
                    <ProtectedRoute roles={['ROLE_UNIVERSITY_ADMIN']}>
                        <ProgramEditPage />
                    </ProtectedRoute>
                }
            />

            {/* Создание нового условия поступления */}
            <Route
                path="/program/edit/:programId/admission-condition/new"
                element={
                    <ProtectedRoute roles={['ROLE_UNIVERSITY_ADMIN']}>
                        <AdmissionConditionEditPage />
                    </ProtectedRoute>
                }
            />

            {/* Редактирование существующего условия поступления */}
            <Route
                path="/program/edit/:programId/admission-condition/:conditionId"
                element={
                    <ProtectedRoute roles={['ROLE_UNIVERSITY_ADMIN']}>
                        <AdmissionConditionEditPage />
                    </ProtectedRoute>
                }
            />

            {/* Перенаправление для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRouter;