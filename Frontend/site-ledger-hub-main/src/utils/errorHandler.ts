import { AxiosError } from 'axios';

export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<{ error?: string }>;
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.response?.status === 401) return 'Session expired. Please login again.';
    if (axiosError.response?.status === 403) return 'You do not have permission to do this.';
    if (axiosError.response?.status === 404) return 'The requested resource was not found.';
    if (axiosError.response?.status === 409) return 'This record already exists.';
    if (axiosError.response?.status && axiosError.response.status >= 500) return 'Server error. Please try again later.';
  }
  return 'Something went wrong. Please try again.';
};
