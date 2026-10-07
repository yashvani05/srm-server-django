export type Role = 'ADMIN' | 'EMPLOYEE';

export type Permission =
  | 'requests.read'
  | 'requests.create'
  | 'requests.update'
  | 'requests.delete'
  | 'requests.status.update'
  | 'dashboard.read';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}
