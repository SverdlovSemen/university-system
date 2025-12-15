import axios from 'axios';
import { ProgramListItemResponse } from '../types';

export const fetchProgramsByFaculty = async (facultyId: number): Promise<ProgramListItemResponse[]> => {
    const response = await axios.get<ProgramListItemResponse[]>(`/api/faculties/${facultyId}/programs/short`);
    return response.data;
};
