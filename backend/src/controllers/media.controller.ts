import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../views/response.view.js';
import { cloudinaryService } from '../services/cloudinary.service.js';

/**
 * [CONTROLLER] Media Controller
 * Responsibility: Cloudinary direct upload signatures and media storage management.
 */
export class MediaController {
  /**
   * GET /api/v1/media/signature or GET /api/v1/media/auth
   * Generates signed parameters for direct frontend-to-Cloudinary upload.
   */
  async getUploadSignature(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const folder = (req.query.folder as string) || 'pujacircle';
      const authParams = cloudinaryService.generateUploadSignature(folder);
      sendSuccess(res, 'Cloudinary upload signature generated successfully.', authParams);
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
