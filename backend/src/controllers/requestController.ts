import { Request, Response } from 'express';
import { InteroperabilityService } from '../services/interoperabilityService';
import { DatabaseService } from '../services/databaseService';
import { VerificationRequestInput } from '../models/types';

export class RequestController {
  /**
   * Primary V1 Gateway Endpoint
   * POST /api/v1/requests
   */
  static async createVerificationRequest(req: Request, res: Response) {
    try {
      const payload: VerificationRequestInput = req.body;
      const result = await InteroperabilityService.processVerificationRequest(payload);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[RequestController Error]', error);
      res.status(500).json({
        error: 'Failed to process verification request',
        message: error.message || 'Internal gateway error'
      });
    }
  }

  /**
   * Request Lookup Endpoint
   * GET /api/v1/requests/:requestId
   */
  static async getRequestById(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const record = await DatabaseService.getRequestById(requestId);

      if (!record) {
        return res.status(404).json({ error: `Request ${requestId} not found` });
      }

      res.status(200).json(record);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch request' });
    }
  }

  /**
   * Gateway Health Check Endpoint
   * GET /api/health
   */
  static async healthCheck(req: Request, res: Response) {
    res.status(200).json({
      status: 'ok',
      service: 'EKSetu API',
      version: '1.0.0'
    });
  }
}
