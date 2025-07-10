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
    name: string;
}

export interface UniversityResponse {
    id: number;
    shortName: string;
    fullName: string;
    type: string;
    avgEgeScore: number | null;
    countryRanking: number | null;
    city: CityResponse;
    faculties: FacultyResponse[];
    description?: string;
}

export interface SubjectResponse {
    id: number;
    name: string;
}

export interface SpecialtyResponse {
    id: number;
    name: string;
    programCode: string;
    description: string;
    facultyId: number;
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
    name: string;
    type: string;
    avgEgeScore: number | null;
    countryRanking: number | null;
    cityId: number;
}