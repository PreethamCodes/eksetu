import { Request, Response } from 'express';
import { InteroperabilityService } from '../services/interoperabilityService';
import { DatabaseService } from '../services/databaseService';
import { VerificationRequestInput } from '../models/types';

export class RequestController {
  /**
   * Primary V2 Gateway Endpoint: Initiates Verification & Requires Consent
   * POST /api/v1/requests
   */
  static async createVerificationRequest(req: Request, res: Response) {
    try {
      const payload: VerificationRequestInput = req.body;
      const result = await InteroperabilityService.initiateVerificationRequest(payload);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[RequestController Error]', error);

      if (error.code === 'UNKNOWN_SERVICE' || error.code === 'AUTHORIZATION_FAILED') {
        return res.status(403).json({
          status: 'AUTHORIZATION_FAILED',
          reason: 'AUTHORIZATION_FAILED',
          message: error.message
        });
      }

      res.status(error.statusCode || 500).json({
        error: error.code || 'GATEWAY_ERROR',
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
        return res.status(404).json({
          error: 'REQUEST_NOT_FOUND',
          message: `Request ${requestId} not found`
        });
      }

      res.status(200).json(record);
    } catch (error: any) {
      res.status(500).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch request'
      });
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
      version: '2.0.0',
      capabilities: ['INTEROPERABILITY', 'CITIZEN_CONSENT', 'AUTHORIZATION']
    });
  }
}
