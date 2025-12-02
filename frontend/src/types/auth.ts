export interface User {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface AuthError {
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}
