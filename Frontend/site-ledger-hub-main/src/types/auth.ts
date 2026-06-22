// Maps to backend UserProfileResponse
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  officeAddress?: string;
  logoUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Backend AuthResponse is flat: { token, name, email }
export interface AuthResponse {
  token: string;
  name: string;
  email: string;
}
