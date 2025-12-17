import axios from 'axios';
import { CityResponse } from '../types';

const API_URL = '/api/cities';

export const fetchAllCities = async (): Promise<CityResponse[]> => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getCityById = async (id: number): Promise<CityResponse> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};
