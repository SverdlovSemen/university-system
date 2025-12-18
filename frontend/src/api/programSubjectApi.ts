import axios from 'axios';

const API_BASE_URL = '/api/programs';

export interface SpecializationSubjectResponse {
    subjectId: number;
    subjectName: string;
    isRequired: boolean;
    minScoreForYear: number;
}

export interface ProgramSubjectResponse {
    subjectId: number;
    subjectName: string;
    examNumber: number;
    minScore?: number;
}

export interface ProgramSubjectRequest {
    subjectId: number;
    examNumber: number;
    minScore?: number;
}

export interface ProgramSubjectsUpdateRequest {
    subjects: ProgramSubjectRequest[];
}

/**
 * Получить все предметы специализации для программы
 */
export const getSpecializationSubjects = async (
    programId: number,
    year?: number
): Promise<SpecializationSubjectResponse[]> => {
    const params = year ? { year } : {};
    const response = await axios.get(
        `${API_BASE_URL}/${programId}/specialization-subjects`,
        { params }
    );
    return response.data;
};

/**
 * Получить предметы для условия поступления
 */
export const getProgramSubjectsForAdmissionCondition = async (
    programId: number,
    admissionConditionId: number
): Promise<ProgramSubjectResponse[]> => {
    const response = await axios.get(
        `${API_BASE_URL}/${programId}/specialization-subjects/admission-condition/${admissionConditionId}`
    );
    return response.data;
};

/**
 * Обновить предметы для условия поступления
 */
export const updateProgramSubjectsForAdmissionCondition = async (
    programId: number,
    admissionConditionId: number,
    data: ProgramSubjectsUpdateRequest
): Promise<ProgramSubjectResponse[]> => {
    const response = await axios.put(
        `${API_BASE_URL}/${programId}/specialization-subjects/admission-condition/${admissionConditionId}`,
        data
    );
    return response.data;
};

