import { Request, Response } from 'express';
import { InteroperabilityService } from '../services/interoperabilityService';
import { DatabaseService } from '../services/databaseService';
import { AuditService } from '../services/auditService';
import { validateTraceAuthorization } from '../middleware/traceAuth';
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
   * V4 Audit Trail Endpoint
   * GET /api/v1/requests/:requestId/audit
   */
  static async getAuditTrail(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const record = await DatabaseService.getRequestById(requestId);

      if (!record) {
        return res.status(404).json({
          error: 'REQUEST_NOT_FOUND',
          message: `Request ${requestId} not found`
        });
      }

      // V4 Server-Side Access Control (CITIZEN, AUDITOR, ADMIN)
      const auth = validateTraceAuthorization(req, record);
      if (!auth.authorized) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: auth.reason || 'Access denied to verification audit trail'
        });
      }

      const events = await AuditService.getEventsByRequestId(requestId);
      res.status(200).json({
        requestId,
        totalEvents: events.length,
        events
      });
    } catch (error: any) {
      console.error('[RequestController getAuditTrail Error]', error);
      res.status(500).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch audit trail'
      });
    }
  }

  /**
   * V4 Provenance Endpoint
   * GET /api/v1/requests/:requestId/provenance
   */
  static async getProvenance(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const record = await DatabaseService.getRequestById(requestId);

      if (!record) {
        return res.status(404).json({
          error: 'REQUEST_NOT_FOUND',
          message: `Request ${requestId} not found`
        });
      }

      // V4 Server-Side Access Control (CITIZEN, AUDITOR, ADMIN)
      const auth = validateTraceAuthorization(req, record);
      if (!auth.authorized) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: auth.reason || 'Access denied to verification provenance'
        });
      }

      let provenance = record.result?.provenance;
      if (!provenance) {
        const sources = record.verification_results?.map((vr: any) => ({
          department: vr.provider,
          status: vr.status,
          verifiedAt: vr.verified_at
        })) || [];
        const releasedData = record.result?.data || {};
        provenance = AuditService.buildProvenance(releasedData, sources);
      }

      res.status(200).json({
        requestId,
        service: record.service,
        verificationStatus: record.status,
        totalVerifiedFields: provenance.length,
        provenance
      });
    } catch (error: any) {
      console.error('[RequestController getProvenance Error]', error);
      res.status(500).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch provenance'
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
      version: '5.0.0',
      capabilities: [
        'INTEROPERABILITY',
        'CITIZEN_CONSENT',
        'AUTHORIZATION',
        'POLICY_ENGINE',
        'DATA_MINIMIZATION',
        'PROVENANCE',
        'AUDIT_TRAIL',
        'CITIZEN_TRANSPARENCY'
      ]
    });
  }
}
