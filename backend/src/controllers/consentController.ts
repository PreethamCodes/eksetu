import { Request, Response } from 'express';
import { z } from 'zod';
import { InteroperabilityService } from '../services/interoperabilityService';

const consentBodySchema = z.object({
  requestId: z.string().min(1, 'requestId is required'),
  decision: z.enum(['ALLOW', 'DENY', 'GRANTED', 'DENIED'], {
    errorMap: () => ({ message: "Decision must be 'ALLOW', 'DENY', 'GRANTED', or 'DENIED'" })
  })
});

export class ConsentController {
  /**
   * Primary V2 Consent Decision Endpoint
   * POST /api/v1/consent
   */
  static async handleConsentDecision(req: Request, res: Response) {
    try {
      const parsed = consentBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'INVALID_REQUEST',
          details: parsed.error.errors.map(e => e.message)
        });
      }

      const { requestId, decision } = parsed.data;
      const result = await InteroperabilityService.processConsentDecision(requestId, decision);

      res.status(200).json(result);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const errorCode = error.code || 'INTERNAL_ERROR';

      res.status(statusCode).json({
        error: errorCode,
        message: error.message || 'An error occurred while processing consent'
      });
    }
  }
}
