import { supabase } from '../utils/supabaseClient';
import { AggregatedVerificationResult, VerificationRequestInput, VerificationStatus } from '../models/types';

// In-memory fallback stores for local zero-dependency testing
const inMemoryRequests: Map<string, any> = new Map();
const inMemoryResults: Map<string, any[]> = new Map();

export class DatabaseService {
  /**
   * Save initial request record
   */
  static async createRequestRecord(
    requestId: string,
    service: string,
    payload: VerificationRequestInput
  ): Promise<void> {
    const record = {
      request_id: requestId,
      service,
      applicant_data: payload.applicant,
      requested_data: payload.requestedData,
      status: 'PENDING',
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

    // Save individual department provider records
    const providerResults = result.sources.map(src => {
      let data: any = {};
      if (src.department === 'Education Department') data = result.verifiedData.education;
      if (src.department === 'Revenue Department') data = result.verifiedData.income;
      if (src.department === 'Residence Department') data = result.verifiedData.residence;

      return {
        request_id: requestId,
        provider: src.department,
        status: src.status,
        data: data || {},
        verified_at: src.verifiedAt || completedAt,
        created_at: completedAt
      };
    });

    inMemoryResults.set(requestId, providerResults);

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

        // Insert provider results
        await supabase
          .from('verification_results')
          .insert(providerResults);
      } catch (err) {
        console.warn('[DB] Supabase complete request error:', err);
      }
    }
  }

  /**
   * Retrieve request by ID
   */
  static async getRequestById(requestId: string): Promise<any | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select('*, verification_results(*)')
          .eq('request_id', requestId)
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('[DB] Supabase query error:', err);
      }
    }

    return inMemoryRequests.get(requestId) || null;
  }
}
