import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { TransparencyService } from '../services/transparencyService';

export class CitizenController {
  /**
   * Retrieves all verification requests for the authenticated citizen.
   * GET /api/v1/citizen/requests
   */
  static async getCitizenRequests(req: Request, res: Response) {
    try {
      const applicantId = (req.headers['x-applicant-id'] || req.headers['x-citizen-id'] || req.query.applicantId) as string | undefined;

      if (!applicantId || !applicantId.trim()) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: "Citizen authorization requires identity verification (missing 'x-applicant-id' header)"
        });
      }

      const records = await DatabaseService.getRequestsByApplicantId(applicantId.trim());

      const requestSummaries = records.map(record => ({
        requestId: record.request_id || record.requestId,
        service: record.service || 'SCHOLARSHIP',
        serviceName: 'Scholarship Portal',
        purpose: record.result?.purpose || record.consent?.purpose || 'Scholarship Eligibility',
        status: record.status,
        statusExplanation: TransparencyService.getStatusExplanation(record.status),
        createdAt: record.created_at || record.createdAt,
        completedAt: record.completed_at || record.result?.timestamp
      }));

      res.status(200).json({
        applicantId: applicantId.trim(),
        totalRequests: requestSummaries.length,
        requests: requestSummaries
      });
    } catch (err: any) {
      console.error('[CitizenController getCitizenRequests Error]', err);
      res.status(500).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to retrieve citizen requests'
      });
    }
  }

  /**
   * Retrieves full citizen transparency & data usage view for a specific request.
   * GET /api/v1/citizen/requests/:requestId
   */
  static async getCitizenRequestDetail(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const applicantId = (req.headers['x-applicant-id'] || req.headers['x-citizen-id'] || req.query.applicantId) as string | undefined;

      if (!applicantId || !applicantId.trim()) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: "Citizen authorization requires identity verification (missing 'x-applicant-id' header)"
        });
      }

      const record = await DatabaseService.getRequestById(requestId);

      if (!record) {
        return res.status(404).json({
          error: 'REQUEST_NOT_FOUND',
          message: `Request ${requestId} not found`
        });
      }

      // Verify request ownership
      const applicantData = record.applicant_data || record.applicant || {};
      const recordAppId = applicantData.applicationId || applicantData.id;
      const recordName = applicantData.name;

      const normalizedReqAppId = applicantId.trim().toLowerCase();
      const matchesAppId = recordAppId && String(recordAppId).trim().toLowerCase() === normalizedReqAppId;
      const matchesName = recordName && String(recordName).trim().toLowerCase() === normalizedReqAppId;

      if (!matchesAppId && !matchesName) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Access denied: Citizen is not authorized to inspect verification details for this request'
        });
      }

      const transparencyView = await TransparencyService.buildCitizenTransparencyView(record);
      res.status(200).json(transparencyView);
    } catch (err: any) {
      console.error('[CitizenController getCitizenRequestDetail Error]', err);
      res.status(500).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to retrieve transparency details'
      });
    }
  }
}
