import axios from 'axios';
import { FacultyResponse, SpecialtyResponse } from '../types';

const API_URL = '/api/faculties';

export const getFacultyById = async (id: number): Promise<FacultyResponse> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const getFacultySpecialties = async (facultyId: number): Promise<SpecialtyResponse[]> => {
    const response = await axios.get(`${API_URL}/${facultyId}/specialties`);
    return response.data;
};

export const searchFaculties = async (query: string, universityId?: number): Promise<FacultyResponse[]> => {
    const params: any = { query };
    if (universityId) params.universityId = universityId;

    const response = await axios.get(`${API_URL}/search`, { params });
    return response.data;
};