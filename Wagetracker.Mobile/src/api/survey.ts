import { apiClient } from './client';
import { SubmitRegistrationSurveyRequest, UserDto } from '../types';

export const surveyApi = {
    submitRegistrationSurvey: async (data: SubmitRegistrationSurveyRequest): Promise<UserDto> => {
        const response = await apiClient.post<UserDto>('/api/survey/registration', data);
        return response.data;
    },

    resetRegistrationSurvey: async (): Promise<UserDto> => {
        const response = await apiClient.delete<UserDto>('/api/survey/registration');
        return response.data;
    },
};
