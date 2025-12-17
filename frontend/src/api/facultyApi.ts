import axios from 'axios';
import { FacultyResponse, FacultyRequest, SpecialtyResponse, ProgramListItemResponse } from '../types';

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

export const getFacultiesByUniversity = async (universityId: number): Promise<FacultyResponse[]> => {
    const response = await axios.get(`${API_URL}/university/${universityId}`);
    return response.data;
};

export const createFaculty = async (data: FacultyRequest): Promise<FacultyResponse> => {
    const response = await axios.post(`${API_URL}`, data);
    return response.data;
};

export const updateFaculty = async (id: number, data: FacultyRequest): Promise<FacultyResponse> => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteFaculty = async (id: number) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

export const fetchProgramsByFaculty = async (facultyId: number): Promise<ProgramListItemResponse[]> => {
    const response = await axios.get<ProgramListItemResponse[]>(`/api/faculties/${facultyId}/programs/short`);
    return response.data;
};
