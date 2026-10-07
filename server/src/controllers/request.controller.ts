import type { Request, Response } from 'express';
import { requestService } from '../services/request.service';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';

export const requestController = {
  async list(req: Request, res: Response) {
    const { items, pagination } = await requestService.list(req.user!, req.query as never);
    sendPaginated(res, 'Service requests fetched successfully', items, pagination);
  },

  async getById(req: Request<{ id: string }>, res: Response) {
    sendSuccess(res, 'Service request fetched successfully', await requestService.getById(req.user!, req.params.id));
  },

  async create(req: Request, res: Response) {
    sendSuccess(res, 'Service request created successfully', await requestService.create(req.user!, req.body), 201);
  },

  async update(req: Request<{ id: string }>, res: Response) {
    sendSuccess(
      res,
      'Service request updated successfully',
      await requestService.update(req.user!, req.params.id, req.body),
    );
  },

  async updateStatus(req: Request<{ id: string }>, res: Response) {
    sendSuccess(
      res,
      'Service request status updated successfully',
      await requestService.updateStatus(req.user!, req.params.id, req.body.status),
    );
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await requestService.remove(req.user!, req.params.id);
    sendSuccess(res, 'Service request deleted successfully', null);
  },
};
