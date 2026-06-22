import axiosInstance from './axiosInstance';
import type { Project, CreateProjectRequest, ProjectFilters } from '@/types/project';

export const projectApi = {
  getAll: async (params?: ProjectFilters) => {
    const res = await axiosInstance.get('api/projects', { params });
    const data = res.data;
    return Array.isArray(data) ? data : (data.content || []);
  },
  getById: (id: string) => axiosInstance.get<Project>(`api/projects/${id}`).then(res => res.data),
  create: (data: CreateProjectRequest) => axiosInstance.post<Project>('api/projects', data).then(res => res.data),
  update: (id: string, data: Partial<Project>) => axiosInstance.put<Project>(`api/projects/${id}`, data).then(res => res.data),
  delete: (id: string) => axiosInstance.delete(`api/projects/${id}`),
};
