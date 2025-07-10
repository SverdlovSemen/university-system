import axios from 'axios';
import {
    UniversityResponse,
    UniversityRequest,
    SpecialtyResponse
} from '../types';

const API_URL = '/api/universities';


export const fetchUniversities = async (
    regionId?: number | null,
    subjectIds?: number[],
    specialtyIds?: number[], // Новый параметр
    minScore?: number | null,
    maxScore?: number | null
): Promise<UniversityResponse[]> => {
    const params = new URLSearchParams();

    if (regionId) params.append('regionId', regionId.toString());

    if (subjectIds && subjectIds.length > 0) {
        subjectIds.forEach(id => params.append('subjectIds', id.toString()));
    }

    // Добавляем передачу specialtyIds
    if (specialtyIds && specialtyIds.length > 0) {
        specialtyIds.forEach(id => params.append('specialtyIds', id.toString()));
    }

    if (minScore) params.append('minScore', minScore.toString());
    if (maxScore) params.append('maxScore', maxScore.toString());

    const response = await axios.get(`${API_URL}/search`, { params });
    return response.data;
};

export const getUniversityById = async (id: number): Promise<UniversityResponse> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const updateUniversity = async (id: number, data: UniversityRequest) => {
    await axios.put(`${API_URL}/${id}`, data);
};

export const getUniversitySpecialties = async (universityId: number): Promise<SpecialtyResponse[]> => {
    const response = await axios.get(`${API_URL}/${universityId}/specialties`);
    return response.data;
};

export const fetchUniversitiesBySpecialty = async (specialtyId: number): Promise<UniversityResponse[]> => {
    const response = await axios.get(`${API_URL}/by-specialty/${specialtyId}`);
    return response.data;
};