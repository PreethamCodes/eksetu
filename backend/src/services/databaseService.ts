import { supabase } from '../utils/supabaseClient';
import {
  AggregatedVerificationResult,
  ConsentRecord,
  VerificationRequestInput,
  VerificationStatus
} from '../models/types';

// In-memory fallback stores for local zero-dependency testing
const inMemoryRequests: Map<string, any> = new Map();
const inMemoryConsents: Map<string, ConsentRecord> = new Map();
const inMemoryResults: Map<string, any[]> = new Map();

export class DatabaseService {
  /**
   * Save initial request record (defaults to CONSENT_PENDING in V2)
   */
  static async createRequestRecord(
    requestId: string,
    service: string,
    payload: VerificationRequestInput,
    status: VerificationStatus = 'CONSENT_PENDING'
  ): Promise<void> {
    const record = {
      request_id: requestId,
      service,
      applicant_data: payload.applicant,
      requested_data: payload.requestedData,
      status,
      created_at: new Date().toISOString()
    };

    inMemoryRequests.set(requestId, record);

    if (supabase) {
      try {
        const { error } = await supabase.from('verification_requests').insert([record]);
        if (error) {
          console.warn('[DB] Supabase insert request error (falling back to memory):', error.message);
        }
      } catch (err) {
        console.warn('[DB] Supabase connection error:', err);
      }
    }
  }

  /**
   * Create consent record in database
   */
  static async createConsentRecord(consent: ConsentRecord): Promise<void> {
    inMemoryConsents.set(consent.requestId, consent);

    if (supabase) {
      try {
        const { error } = await supabase.from('consents').insert([{
          request_id: consent.requestId,
          service: consent.service,
          purpose: consent.purpose,
          requested_fields: consent.requestedFields,
          decision: consent.decision,
          consent_type: consent.consentType,
          created_at: consent.createdAt,
          updated_at: consent.updatedAt || consent.createdAt
        }]);

        if (error) {
          console.warn('[DB] Supabase insert consent error (falling back to memory):', error.message);
        }
      } catch (err) {
        console.warn('[DB] Supabase consent connection error:', err);
      }
    }
  }

  /**
   * Update consent decision
   */
  static async updateConsentRecord(
    requestId: string,
    decision: 'GRANTED' | 'DENIED'
  ): Promise<ConsentRecord | null> {
    const existing = inMemoryConsents.get(requestId);
    const updatedAt = new Date().toISOString();

    if (existing) {
      existing.decision = decision;
      existing.updatedAt = updatedAt;
    }

    if (supabase) {
      try {
        await supabase
          .from('consents')
          .update({
            decision,
            updated_at: updatedAt
          })
          .eq('request_id', requestId);
      } catch (err) {
        console.warn('[DB] Supabase update consent error:', err);
      }
    }

    return existing || null;
  }

  /**
   * Retrieve consent record by Request ID
   */
  static async getConsentByRequestId(requestId: string): Promise<ConsentRecord | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('consents')
          .select('*')
          .eq('request_id', requestId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            requestId: data.request_id,
            service: data.service,
            purpose: data.purpose,
            requestedFields: data.requested_fields,
            decision: data.decision,
            consentType: data.consent_type,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('[DB] Supabase consent query error:', err);
      }
    }

    return inMemoryConsents.get(requestId) || null;
  }

  /**
   * Update request status only
   */
  static async updateRequestStatus(
    requestId: string,
    status: VerificationStatus,
    completedAt?: string
  ): Promise<void> {
    const existing = inMemoryRequests.get(requestId);
    if (existing) {
      existing.status = status;
      if (completedAt) existing.completed_at = completedAt;
    }

    if (supabase) {
      try {
        const updateData: any = { status };
        if (completedAt) updateData.completed_at = completedAt;

        await supabase
          .from('verification_requests')
          .update(updateData)
          .eq('request_id', requestId);
      } catch (err) {
        console.warn('[DB] Supabase update status error:', err);
      }
    }
  }

  /**
   * Update verification request with completion status and save individual provider results
   */
  static async completeRequestRecord(
    requestId: string,
    result: AggregatedVerificationResult
  ): Promise<void> {
    const completedAt = new Date().toISOString();

    const existing = inMemoryRequests.get(requestId);
    if (existing) {
      existing.status = result.status;
      existing.completed_at = completedAt;
      existing.result = result;
    }

    // Save individual department provider records if any data was released
    const providerResults = (result.sources || []).map(src => {
      let data: any = {};
      if (src.department === 'Education Department') data = result.verifiedData?.education;
      if (src.department === 'Revenue Department') data = result.verifiedData?.income;
      if (src.department === 'Residence Department') data = result.verifiedData?.residence;

      return {
        request_id: requestId,
        provider: src.department,
        status: src.status,
        data: data || {},
        verified_at: src.verifiedAt || completedAt,
        created_at: completedAt
      };
    });

    if (providerResults.length > 0) {
      inMemoryResults.set(requestId, providerResults);
    }

    if (supabase) {
      try {
        // Update request status
        await supabase
          .from('verification_requests')
          .update({
            status: result.status,
            completed_at: completedAt
          })
          .eq('request_id', requestId);

        // Insert provider results if any
        if (providerResults.length > 0) {
          await supabase
            .from('verification_results')
            .insert(providerResults);
        }
      } catch (err) {
        console.warn('[DB] Supabase complete request error:', err);
      }
    }
  }

  /**
   * Retrieve request by ID with associated consent and results
   */
  static async getRequestById(requestId: string): Promise<any | null> {
    let requestData: any = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select('*, verification_results(*), consents(*)')
          .eq('request_id', requestId)
          .single();

        if (!error && data) {
          requestData = data;
        }
      } catch (err) {
        console.warn('[DB] Supabase query error:', err);
      }
    }

    if (!requestData) {
      requestData = inMemoryRequests.get(requestId) || null;
      if (requestData) {
        requestData.consent = inMemoryConsents.get(requestId) || null;
        requestData.verification_results = inMemoryResults.get(requestId) || [];
      }
    }

    return requestData;
  }
}
