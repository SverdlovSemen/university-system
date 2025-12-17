import axios from 'axios';

export const getAllUsers = async () => {
    const response = await axios.get('/api/auth/users');
    return response.data;
};

export const assignUniversityAdmin = async (userId: number, universityId?: number) => {
    const response = await axios.post('/api/auth/assign-university-admin', { userId, universityId });
    return response.data;
};

export const assignEditorByAdmin = async (userId: number, universityId?: number) => {
    const response = await axios.post('/api/auth/assign-editor', { userId, universityId });
    return response.data;
};

export const getUniversityEditors = async (universityId: number) => {
    const response = await axios.get(`/api/universities/${universityId}/editors`);
    return response.data;
};

export const assignEditorToUniversity = async (universityId: number, userId: number) => {
    const response = await axios.post(`/api/universities/${universityId}/editors`, { userId });
    return response.data;
};

export const removeEditorFromUniversity = async (universityId: number, userId: number) => {
    const response = await axios.delete(`/api/universities/${universityId}/editors/${userId}`);
    return response.data;
};

export interface AdminStats {
    totalUsers: number;
    totalUniversities: number;
    totalPrograms: number;
    pendingApplications: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
    const response = await axios.get('/api/admin/stats');
    return response.data;
};

