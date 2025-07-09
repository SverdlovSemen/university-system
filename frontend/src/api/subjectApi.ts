import axios from 'axios';
import { SubjectResponse } from '../types';

const API_URL = '/api/subjects';

export const fetchAllSubjects = async (): Promise<SubjectResponse[]> => {
    const response = await axios.get(API_URL);
    return response.data;
};