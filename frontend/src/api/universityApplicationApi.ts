import axios from 'axios';

const API_BASE_URL = '/api/university-applications';

export interface UniversityApplicationRequest {
    fullName: string;
    abbreviation?: string;
    website?: string;
    contactPersonName: string;
    contactPersonPosition?: string;
    contactEmail: string;
    contactPhone?: string;
}

export interface UniversityApplicationResponse {
    id: number;
    userId: number;
    fullName: string;
    abbreviation?: string;
    website?: string;
    contactPersonName: string;
    contactPersonPosition?: string;
    contactEmail: string;
    contactPhone?: string;
    statusName: string;
    processedBy?: number;
    processedAt?: string;
}

export interface UniversityApplicationWithUserResponse {
    id: number;
    userId: number;
    userEmail: string;
    fullName: string;
    abbreviation?: string;
    website?: string;
    contactPersonName: string;
    contactPersonPosition?: string;
    contactEmail: string;
    contactPhone?: string;
    statusName: string;
    processedBy?: number;
    processedAt?: string;
}

export const createUniversityApplication = async (
    request: UniversityApplicationRequest
): Promise<UniversityApplicationResponse> => {
    const response = await axios.post<UniversityApplicationResponse>(API_BASE_URL, request);
    return response.data;
};

export const getMyApplications = async (): Promise<UniversityApplicationResponse[]> => {
    const response = await axios.get<UniversityApplicationResponse[]>(`${API_BASE_URL}/my-applications`);
    return response.data;
};

export const hasActiveApplication = async (): Promise<boolean> => {
    const response = await axios.get<boolean>(`${API_BASE_URL}/has-active`);
    return response.data;
};

export const getPendingApplications = async (): Promise<UniversityApplicationWithUserResponse[]> => {
    const response = await axios.get<UniversityApplicationWithUserResponse[]>(`${API_BASE_URL}/pending`);
    return response.data;
};

export const rejectApplication = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${id}`);
};

export const declineOwnApplication = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${id}/decline`);
};

export const approveApplication = async (id: number): Promise<UniversityApplicationResponse> => {
    const response = await axios.post<UniversityApplicationResponse>(`${API_BASE_URL}/${id}/approve`);
    return response.data;
};

