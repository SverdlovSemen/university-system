import axios from 'axios';
import { RegionResponse } from '../types';

const API_URL = '/api/regions';

export const fetchAllRegions = async (): Promise<RegionResponse[]> => {
    const response = await axios.get(API_URL);
    return response.data;
};