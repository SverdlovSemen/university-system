import axios from 'axios';
import { DisciplineResponse } from '../types';

export interface DisciplineRequest {
    name: string;
    semester: number;
    totalHours: number;
}

export const createDiscipline = async (programId: number, data: DisciplineRequest): Promise<DisciplineResponse> => {
    const response = await axios.post(`/api/programs/${programId}/disciplines`, data);
    return response.data;
};

export const getDisciplinesByProgram = async (programId: number): Promise<DisciplineResponse[]> => {
    // Получаем программу, чтобы узнать universityId
    const programResponse = await axios.get(`/api/programs/${programId}`);
    const universityId = programResponse.data.faculty.university.id;

    const response = await axios.get(`/api/universities/${universityId}/programs/${programId}/disciplines`);
    return response.data;
};

