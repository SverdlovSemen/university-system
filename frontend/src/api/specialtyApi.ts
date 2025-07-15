import axios from 'axios';
import { SpecialtyResponse } from '../types';

const API_URL = '/api/specialties';

export const searchSpecialties = async (query?: string): Promise<SpecialtyResponse[]> => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);

    const response = await axios.get(`${API_URL}/search`, { params });
    return response.data;
};

export const fetchSpecialtiesByUniversity = async (
    universityId: number,
    facultyId?: number
): Promise<SpecialtyResponse[]> => {
    const params: any = { universityId };
    if (facultyId !== undefined) {
        params.facultyId = facultyId;
    }

    const response = await axios.get(`${API_URL}/by-university`, { params });
    return response.data;
};

export const getSpecialtyById = async (id: number): Promise<SpecialtyResponse> => {
    const response = await axios.get(`/api/specialties/${id}`);
    return response.data;
};

// Добавляем функцию для поиска специальностей по предметам
export const fetchSpecialtiesBySubjects = async (subjectIds: number[]): Promise<SpecialtyResponse[]> => {
    const params = new URLSearchParams();
    subjectIds.forEach(id => params.append('subjectIds', id.toString()));

    const response = await axios.get(`${API_URL}/by-subjects`, { params });
    return response.data;
};