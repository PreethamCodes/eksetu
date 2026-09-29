import { ConsentDecision, ConsentRecord, ConsentType } from '../models/types';
import { DatabaseService } from './databaseService';

export class ConsentService {
  /**
   * Creates a one-time consent request bound to a specific verification request
   */
  static async createConsentRequest(
    requestId: string,
    service: string,
    requestedFields: string[],
    purpose = 'Scholarship Eligibility'
  ): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      requestId,
      service,
      serviceName: 'Scholarship Service',
      purpose,
      requestedFields,
      decision: 'PENDING',
      consentType: 'ONE_TIME',
      createdAt: new Date().toISOString()
    };

    await DatabaseService.createConsentRecord(consent);
    return consent;
  }

  /**
   * Retrieves the consent record for a request
   */
  static async getConsentStatus(requestId: string): Promise<ConsentRecord | null> {
    return DatabaseService.getConsentByRequestId(requestId);
  }

  /**
   * Validates if a consent decision can be processed for the given request ID
   */
  static async validateConsentState(requestId: string): Promise<{
    valid: boolean;
    error?: string;
    code?: number;
    requestRecord?: any;
    consentRecord?: ConsentRecord | null;
  }> {
    const requestRecord = await DatabaseService.getRequestById(requestId);

    if (!requestRecord) {
      return {
        valid: false,
        error: 'REQUEST_NOT_FOUND',
        code: 404
      };
    }

    const consentRecord = await DatabaseService.getConsentByRequestId(requestId);

    // If request is not in CONSENT_PENDING or consent is already decided
    if (requestRecord.status !== 'CONSENT_PENDING' || (consentRecord && consentRecord.decision !== 'PENDING')) {
      return {
        valid: false,
        error: 'CONSENT_ALREADY_PROCESSED',
        code: 409,
        requestRecord,
        consentRecord
      };
    }

    return {
      valid: true,
      requestRecord,
      consentRecord
    };
  }

  /**
   * Records citizen consent decision (GRANTED or DENIED)
   */
  static async recordConsentDecision(
    requestId: string,
    decision: 'GRANTED' | 'DENIED'
  ): Promise<ConsentRecord | null> {
    return DatabaseService.updateConsentRecord(requestId, decision);
  }
}
