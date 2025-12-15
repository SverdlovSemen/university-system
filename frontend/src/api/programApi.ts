import { ProgramResponse } from '../types';
import axios from 'axios';

export interface FacultyShortResponse {
    id: number;
    fullName: string;
    abbreviation?: string;
}

export interface SpecialtyShortResponse {
    id: number;
    name: string;
    programCode: string;
    educationLevel: string;
}

export interface ProgramListItemResponse {
    id: number;
    faculty: FacultyShortResponse;
    specialty: SpecialtyShortResponse;
}

export const fetchProgramsByUniversity = async (universityId: number): Promise<ProgramListItemResponse[]> => {
    const response = await axios.get<ProgramListItemResponse[]>(`/api/universities/${universityId}/programs/short`);
    return response.data;
};

export const fetchProgramDetailsByUniversity = async (universityId: number): Promise<ProgramResponse[]> => {
    const response = await axios.get<ProgramResponse[]>(`/api/universities/${universityId}/programs`);
    return response.data;
};
