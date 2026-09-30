import crypto from 'crypto';
import {
  AuditEvent,
  AuditEventType,
  DepartmentSourceSummary,
  ProvenanceRecord
} from '../models/types';
import { DatabaseService } from './databaseService';

export class AuditService {
  /**
   * Sanitizes metadata to ensure sensitive citizen data or secrets are never logged.
   */
  private static sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;
    const sanitized: Record<string, any> = {};
    const prohibitedKeys = [
      'bankbalance',
      'bank_balance',
      'aadhaar',
      'aadhaarno',
      'aadhaar_number',
      'password',
      'secret',
      'apikey',
      'api_key',
      'taxhistory',
      'tax_history',
      'fulladdress',
      'full_address'
    ];

    for (const [key, value] of Object.entries(metadata)) {
      if (prohibitedKeys.includes(key.toLowerCase())) {
        continue; // Exclude prohibited sensitive fields
      }
      sanitized[key] = value;
    }
    return sanitized;
  }

  /**
   * Records an audit event.
   * Safe execution: Never throws or interrupts verification pipeline on audit persistence failure.
   */
  static async recordEvent(eventInput: {
    requestId: string;
    eventType: AuditEventType;
    service?: string;
    provider?: string;
    status?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditEvent> {
    const now = new Date().toISOString();
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      requestId: eventInput.requestId,
      eventType: eventInput.eventType,
      service: eventInput.service,
      provider: eventInput.provider,
      status: eventInput.status || 'INFO',
      metadata: this.sanitizeMetadata(eventInput.metadata),
      createdAt: now,
      timestamp: now
    };

    try {
      await DatabaseService.createAuditEvent(event);
    } catch (err: any) {
      console.error(`[AUDIT] Failed to persist audit event ${event.eventType} for request ${event.requestId}:`, err?.message || err);
    }

    return event;
  }

  /**
   * Retrieves all audit events for a request ID ordered chronologically.
   */
  static async getEventsByRequestId(requestId: string): Promise<AuditEvent[]> {
    try {
      return await DatabaseService.getAuditEventsByRequestId(requestId);
    } catch (err: any) {
      console.error(`[AUDIT] Failed to retrieve audit events for ${requestId}:`, err?.message || err);
      return [];
    }
  }

  /**
   * Builds provenance records for released data fields.
   * Answers: Which department verified this specific field?
   * Only includes fields that were actually released in data.
   */
  static buildProvenance(
    releasedData: Record<string, any> | undefined,
    sources: DepartmentSourceSummary[] = []
  ): ProvenanceRecord[] {
    if (!releasedData || Object.keys(releasedData).length === 0) {
      return [];
    }

    const sourceMap = new Map<string, DepartmentSourceSummary>();
    for (const src of sources) {
      sourceMap.set(src.department, src);
    }

    const fieldProviderMap: Record<string, { provider: 'EDUCATION' | 'REVENUE' | 'RESIDENCE'; deptName: string }> = {
      marksPercentage: { provider: 'EDUCATION', deptName: 'Education Department' },
      studentName: { provider: 'EDUCATION', deptName: 'Education Department' },
      qualification: { provider: 'EDUCATION', deptName: 'Education Department' },
      studentStatus: { provider: 'EDUCATION', deptName: 'Education Department' },

      annualIncome: { provider: 'REVENUE', deptName: 'Revenue Department' },
      incomeStatus: { provider: 'REVENUE', deptName: 'Revenue Department' },

      domicileState: { provider: 'RESIDENCE', deptName: 'Residence Department' },
      state: { provider: 'RESIDENCE', deptName: 'Residence Department' },
      residenceStatus: { provider: 'RESIDENCE', deptName: 'Residence Department' }
    };

    const provenanceRecords: ProvenanceRecord[] = [];
    const now = new Date().toISOString();

    for (const field of Object.keys(releasedData)) {
      const mapping = fieldProviderMap[field];
      if (mapping) {
        const source = sourceMap.get(mapping.deptName);
        const status = source && source.status === 'VERIFIED' ? 'VERIFIED' : 'FAILED';
        const verifiedAt = source?.verifiedAt || now;
        const isLegacy = source?.providerId === 'LEGACY_EDUCATION';
        const providerId = source?.providerId || mapping.provider;
        const providerName = isLegacy ? 'Legacy Education Department System' : mapping.deptName;
        const protocol = source?.protocol || (isLegacy ? 'SOAP_XML' : 'REST');

        provenanceRecords.push({
          field,
          provider: providerId as any,
          providerId,
          providerName,
          protocol,
          status,
          verifiedAt
        });
      }
    }

    return provenanceRecords;
  }
}
