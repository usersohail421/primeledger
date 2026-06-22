import axiosInstance from './axiosInstance';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth';

export const authApi = {
  login: (data: LoginRequest) => axiosInstance.post<AuthResponse>('api/auth/login', data).then(res => res.data),
  register: (data: RegisterRequest) => axiosInstance.post<AuthResponse>('api/auth/register', data).then(res => res.data),
  getProfile: () => axiosInstance.get<User>('api/auth/profile').then(res => res.data),
  updateProfile: (data: Partial<User>) => axiosInstance.put<User>('api/auth/profile', data).then(res => res.data),
};
