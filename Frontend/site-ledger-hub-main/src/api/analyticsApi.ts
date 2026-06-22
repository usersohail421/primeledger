import axiosInstance from './axiosInstance';
import type { ProjectSummaryResponse, WeeklySpend, WeekComparison, TopItem } from '@/types/analytics';

export const analyticsApi = {
  getSummary: (projectId: string) => axiosInstance.get<ProjectSummaryResponse>(`api/projects/${projectId}/analytics/summary`).then(res => res.data),
  getWeeklySpend: (projectId: string) => axiosInstance.get<WeeklySpend[]>(`api/projects/${projectId}/analytics/weekly`).then(res => res.data),
  getWeekComparison: (projectId: string) => axiosInstance.get<WeekComparison>(`api/projects/${projectId}/analytics/week-comparison`).then(res => res.data),
  getTopItems: (projectId: string) => axiosInstance.get<TopItem[]>(`api/projects/${projectId}/analytics/top-items`).then(res => res.data),
};
