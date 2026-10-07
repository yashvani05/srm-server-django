import type { AuthResult, LoginPayload, RegisterPayload, User } from '../../types/auth';
import { api, unwrap } from './axiosInstance';

export const authApi = {
  login: (payload: LoginPayload) => unwrap<AuthResult>(api.post('/auth/login', payload)),
  register: (payload: RegisterPayload) => unwrap<AuthResult>(api.post('/auth/register', payload)),
  logout: () => unwrap<null>(api.post('/auth/logout')),
  getMe: async () => (await unwrap<{ user: User }>(api.get('/auth/me'))).user,
};
