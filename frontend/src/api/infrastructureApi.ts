import axios from 'axios';
import { InfrastructureResponse } from '../types';

const API_URL = '/api/infrastructure';

export const fetchInfrastructureByUniversity = async (universityId: number): Promise<InfrastructureResponse[]> => {
    const response = await axios.get(`${API_URL}/university/${universityId}`);
    return response.data;
};

