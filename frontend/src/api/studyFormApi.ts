import axios from 'axios';
import { StudyFormResponse } from '../types';

const API_BASE_URL = '/api';

/**
 * Получить все формы обучения
 */
export const getAllStudyForms = async (): Promise<StudyFormResponse[]> => {
    const response = await axios.get<StudyFormResponse[]>(`${API_BASE_URL}/study-forms`);
    return response.data;
};

