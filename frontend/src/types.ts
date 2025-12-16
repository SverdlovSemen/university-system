// Интерфейсы, соответствующие Java DTO на бэкенде
import {FacultyShortResponse, SpecialtyShortResponse} from "./api/programApi";

export interface CityResponse {
    id: number;
    name: string;
    region: RegionResponse;
}

export interface RegionResponse {
    id: number;
    name: string;
}

export interface FacultyResponse {
    id: number;
    fullName: string;
    abbreviation?: string;
    universityId?: number;
    deanName?: string;
    deanContacts?: string;
    address?: string;
    email?: string;
    phone?: string;
}

export interface UniversityResponse {
    id: number;
    fullName: string;
    abbreviation: string;
    type: string;
    ownershipType?: string;
    city?: CityResponse;
    foundedYear?: number;
    website?: string;
    adminEmail?: string;
    adminPhone?: string;
    accreditationNumber?: string;
    accreditationExpiryDate?: string;
    status?: string;
    faculties?: FacultyResponse[];
}

export interface SubjectResponse {
    id: number;
    name: string;
    examNumber?: number;
    minScore?: number;
}

export interface SpecialtyResponse {
    id: number;
    name: string;
    programCode: string;
    description?: string;
    facultyIds: number[];
    subjectCombinations: SubjectCombinationResponse[];
    educationLevel: string; // Added field for education level
}

export interface SubjectCombinationResponse {
    id: number;
    specialtyId: number;
    subjects: SubjectResponse[];
}

export interface AdmissionConditionResponse {
    year: number;
    passingScore: number;
    budgetPlaces: number;
    targetedPlaces: number;
    paidPlaces: number;
    subjects: SubjectResponse[];
    admissionFee?: number; // стоимость поступления
    hasDvi?: boolean; // наличие ДВИ
    minScore?: number; // минимальный балл (добавлено)
}

export interface ProgramResponse {
    id: number;
    faculty: FacultyShortResponse;
    specialty: SpecialtyShortResponse;
    programDescription?: string;
    studyForm?: string;
    duration?: string;
    mobilityOption: boolean; // строго boolean
    teachingLanguage?: string; // поле для языка обучения как на бэкенде
    admissionConditions: AdmissionConditionResponse[];
    subjects: SubjectResponse[];
}

export interface DisciplineResponse {
    id: number;
    name: string;
    semester: number;
    totalHours: number;
}

export interface ProgramListItemResponse {
    id: number;
    faculty: FacultyShortResponse;
    specialty: SpecialtyShortResponse;
}

// Типы для запросов
export interface SpecialtyRequest {
    id: number;
    name: string;
    programCode: string;
    description: string;
    facultyId: number;
}
export interface SelectOption {
    value: number;
    label: string;
}


export interface UniversityRequest {
    id: number;
    fullName: string;
    abbreviation: string;
    type: string;
    ownershipType?: string;
    cityId?: number;
    foundedYear?: number;
    website?: string;
    adminEmail?: string;
    adminPhone?: string;
    accreditationNumber?: string;
    accreditationExpiryDate?: string;
}

export interface User {
    id: number;
    email: string;
    firstName: string;
    roles: string[];
    favoriteUniversities: number[];
    favoriteSpecialties: number[];
}

export interface RegisterRequest {
    email: string;
    firstName: string;
    password: string;
}