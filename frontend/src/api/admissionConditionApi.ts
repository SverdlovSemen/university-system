import axios from 'axios';
import { AdmissionConditionResponse } from '../types';

export interface AdmissionConditionRequest {
    year: number;
    passingScore?: number;
    budgetPlaces?: number;
    targetedPlaces?: number;
    paidPlaces?: number;
    admissionFee?: number;
    hasDvi?: boolean;
}

export const getAdmissionConditions = async (programId: number): Promise<AdmissionConditionResponse[]> => {
    const response = await axios.get<AdmissionConditionResponse[]>(`/api/programs/${programId}/admission-conditions`);
    return response.data;
};

export const getAdmissionConditionById = async (programId: number, id: number): Promise<AdmissionConditionResponse> => {
    const response = await axios.get<AdmissionConditionResponse>(`/api/programs/${programId}/admission-conditions/${id}`);
    return response.data;
};

export const createAdmissionCondition = async (programId: number, data: AdmissionConditionRequest): Promise<AdmissionConditionResponse> => {
    const response = await axios.post<AdmissionConditionResponse>(`/api/programs/${programId}/admission-conditions`, data);
    return response.data;
};

export const updateAdmissionCondition = async (programId: number, id: number, data: AdmissionConditionRequest): Promise<AdmissionConditionResponse> => {
    const response = await axios.put<AdmissionConditionResponse>(`/api/programs/${programId}/admission-conditions/${id}`, data);
    return response.data;
};

export const deleteAdmissionCondition = async (programId: number, id: number): Promise<void> => {
    await axios.delete(`/api/programs/${programId}/admission-conditions/${id}`);
};

// Быстрое копирование условий поступления на другой год через БД-процедуру
export const copyAdmissionCondition = async (
    programId: number,
    sourceConditionId: number,
    targetYear: number
): Promise<AdmissionConditionResponse[]> => {
    const response = await axios.post<AdmissionConditionResponse[]>(
        `/api/programs/${programId}/admission-conditions/${sourceConditionId}/copy-to-year`,
        { targetYear }
    );
    return response.data;
};
