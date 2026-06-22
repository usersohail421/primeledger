import axiosInstance from './axiosInstance';
import type { Bill, CreateBillRequest, BillFilters, ItemSearchResponse } from '@/types/bill';

export const searchBillItems = (projectId: number, keyword: string) =>
  axiosInstance.get<ItemSearchResponse>(`/api/projects/${projectId}/bills/items/search`, {
    params: { keyword }
  });

export const billApi = {
  getAll: async (projectId: string, params?: BillFilters) => {
    const res = await axiosInstance.get(`api/projects/${projectId}/bills`, { params });
    const data = res.data;
    return Array.isArray(data) ? data : (data.content || []);
  },
  getById: (projectId: string, billId: string) =>
    axiosInstance.get<Bill>(`api/projects/${projectId}/bills/${billId}`).then(res => res.data),
  create: (projectId: string, data: CreateBillRequest) =>
    axiosInstance.post<Bill>(`api/projects/${projectId}/bills`, data).then(res => res.data),
  update: (projectId: string, billId: string, data: Partial<Bill>) =>
    axiosInstance.put<Bill>(`api/projects/${projectId}/bills/${billId}`, data).then(res => res.data),
  delete: (projectId: string, billId: string) =>
    axiosInstance.delete(`api/projects/${projectId}/bills/${billId}`),
  downloadPdf: async (projectId: string, billId: string) => {
    const res = await axiosInstance.get(`api/projects/${projectId}/bills/${billId}/pdf`, {
      responseType: 'blob',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      params: { _t: Date.now() },
    });
    return res.data;
  },
};
