// 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' from Java enum — backend sends as-is
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED';

// Maps to backend ProjectResponse
export interface Project {
  id: number;
  name: string;
  location: string;
  description?: string;
  status: ProjectStatus;
  billSerialCounter: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  location: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  location?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  page?: number;
  size?: number;
}

// Spring Page<T> wrapper from backend
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
