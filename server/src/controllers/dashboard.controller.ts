import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/apiResponse';

export const dashboardController = {
  async getSummary(_req: Request, res: Response) {
    const { summary, cache } = await dashboardService.getSummary();
    res.set('X-Cache', cache);
    sendSuccess(res, 'Dashboard summary fetched successfully', summary);
  },
};
