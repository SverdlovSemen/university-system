// Интерфейсы, соответствующие Java DTO на бэкенде
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
}

export interface SpecialtyResponse {
    id: number;
    name: string;
    programCode: string;
    description?: string;
    facultyIds: number[];
    subjectCombinations: SubjectCombinationResponse[];
}

export interface SubjectCombinationResponse {
    id: number;
    specialtyId: number;
    subjects: SubjectResponse[];
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