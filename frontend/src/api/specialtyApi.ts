import axios from 'axios';
import { SpecialtyResponse } from '../types';

const API_URL = '/api/specialties';

export const fetchSpecialtiesByUniversity = async (universityId: number): Promise<SpecialtyResponse[]> => {
    const response = await axios.get(`${API_URL}/university/${universityId}`);
    return response.data;
};

export const getSpecialtyById = async (id: number): Promise<SpecialtyResponse> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

// Добавляем функцию для поиска специальностей по предметам
export const fetchSpecialtiesBySubjects = async (subjectIds: number[]): Promise<SpecialtyResponse[]> => {
    const params = new URLSearchParams();
    subjectIds.forEach(id => params.append('subjectIds', id.toString()));

    const response = await axios.get(`${API_URL}/by-subjects`, { params });
    return response.data;
};