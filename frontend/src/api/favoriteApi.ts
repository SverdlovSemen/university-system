import axios from 'axios';

// API для добавления университета в избранное
export const addFavoriteUniversity = async (universityId: number): Promise<void> => {
    await axios.post(`/api/favorites/university/${universityId}`);
};

// API для удаления университета из избранного
export const removeFavoriteUniversity = async (universityId: number): Promise<void> => {
    await axios.delete(`/api/favorites/university/${universityId}`);
};

// API для добавления программы/специальности в избранное
export const addFavoriteProgram = async (programId: number): Promise<void> => {
    await axios.post(`/api/favorites/program/${programId}`);
};

// API для удаления программы/специальности из избранного
export const removeFavoriteProgram = async (programId: number): Promise<void> => {
    await axios.delete(`/api/favorites/program/${programId}`);
};
