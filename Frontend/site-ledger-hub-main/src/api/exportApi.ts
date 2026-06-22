import axiosInstance from './axiosInstance';

export const exportApi = {
  downloadExcel: async (projectId: string) => {
    const res = await axiosInstance.get(`api/projects/${projectId}/export/excel`, { responseType: 'blob' });
    return res.data;
  }
};
