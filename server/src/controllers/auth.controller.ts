import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    sendSuccess(res, 'Registration successful', result, 201);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    sendSuccess(res, 'Login successful', result);
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.tokenClaims!);
    sendSuccess(res, 'Logged out successfully', null);
  },

  me(req: Request, res: Response) {
    sendSuccess(res, 'Current user fetched successfully', { user: req.user });
  },
};
