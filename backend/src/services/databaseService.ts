import { supabase } from '../utils/supabaseClient';
import {
  AggregatedVerificationResult,
  AuditEvent,
  ConsentRecord,
  VerificationRequestInput,
  VerificationStatus
} from '../models/types';

// In-memory fallback stores for local zero-dependency testing
const inMemoryRequests: Map<string, any> = new Map();
const inMemoryConsents: Map<string, ConsentRecord> = new Map();
const inMemoryResults: Map<string, any[]> = new Map();
const inMemoryAuditEvents: Map<string, AuditEvent[]> = new Map();

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
      simulate_failure: payload.simulateFailure,
      simulateFailure: payload.simulateFailure,
      status,
      created_at: new Date().toISOString()
    };

    inMemoryRequests.set(requestId, record);

    if (supabase) {
      try {
        const { error } = await supabase.from('verification_requests').insert([{
          request_id: requestId,
          service,
          applicant_data: payload.applicant,
          requested_data: payload.requestedData,
          status,
          created_at: record.created_at
        }]);
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
    completedAt?: string,
    result?: AggregatedVerificationResult
  ): Promise<void> {
    const existing = inMemoryRequests.get(requestId);
    if (existing) {
      existing.status = status;
      if (completedAt) existing.completed_at = completedAt;
      if (result) existing.result = result;
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
   * Retrieve all requests for a specific applicant ID
   */
  static async getRequestsByApplicantId(applicantId: string): Promise<any[]> {
    const normalized = applicantId.trim().toLowerCase();
    const results: any[] = [];

    for (const [reqId, reqRecord] of inMemoryRequests.entries()) {
      const applicant = reqRecord.applicant_data || reqRecord.applicant || {};
      const appId = applicant.applicationId || applicant.id;
      const appName = applicant.name;

      if (
        (appId && String(appId).toLowerCase() === normalized) ||
        (appName && String(appName).toLowerCase() === normalized)
      ) {
        const enriched = { ...reqRecord };
        enriched.consent = inMemoryConsents.get(reqId) || null;
        enriched.verification_results = inMemoryResults.get(reqId) || [];
        enriched.audit_events = inMemoryAuditEvents.get(reqId) || [];
        results.push(enriched);
      }
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select('*, verification_results(*), consents(*)')
          .or(`applicant_data->>applicationId.ilike.${applicantId},applicant_data->>id.ilike.${applicantId},applicant_data->>name.ilike.${applicantId}`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          for (const item of data) {
            const inMem = inMemoryRequests.get(item.request_id);
            if (inMem?.result) item.result = inMem.result;
            if (inMem?.applicant_data) item.applicant_data = inMem.applicant_data;
            if (inMem?.simulate_failure) item.simulate_failure = inMem.simulate_failure;
            if (inMem?.simulateFailure) item.simulateFailure = inMem.simulateFailure;
          }
          return data;
        }
      } catch (err) {
        console.warn('[DB] Supabase getRequestsByApplicantId error:', err);
      }
    }

    results.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return results;
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
          const inMem = inMemoryRequests.get(requestId);
          if (inMem) {
            if (inMem.result) requestData.result = inMem.result;
            if (inMem.applicant_data) requestData.applicant_data = inMem.applicant_data;
            if (inMem.requested_data) requestData.requested_data = inMem.requested_data;
            if (inMem.simulate_failure) requestData.simulate_failure = inMem.simulate_failure;
            if (inMem.simulateFailure) requestData.simulateFailure = inMem.simulateFailure;
          }
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

  /**
   * Save an audit event record (V4)
   */
  static async createAuditEvent(event: AuditEvent): Promise<void> {
    const list = inMemoryAuditEvents.get(event.requestId) || [];
    list.push(event);
    inMemoryAuditEvents.set(event.requestId, list);

    if (supabase) {
      try {
        const { error } = await supabase.from('audit_events').insert([{
          id: event.id,
          request_id: event.requestId,
          event_type: event.eventType,
          service: event.service,
          provider: event.provider,
          status: event.status,
          metadata: event.metadata,
          created_at: event.createdAt
        }]);
        if (error) {
          console.warn('[DB] Supabase insert audit_event error (falling back to memory):', error.message);
        }
      } catch (err) {
        console.warn('[DB] Supabase audit connection error:', err);
      }
    }
  }

  /**
   * Retrieve audit events for a request ID ordered chronologically (V4)
   */
  static async getAuditEventsByRequestId(requestId: string): Promise<AuditEvent[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_events')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            requestId: d.request_id,
            eventType: d.event_type,
            service: d.service,
            provider: d.provider,
            status: d.status,
            metadata: d.metadata,
            createdAt: d.created_at,
            timestamp: d.created_at
          }));
        }
      } catch (err) {
        console.warn('[DB] Supabase audit query error:', err);
      }
    }

    return inMemoryAuditEvents.get(requestId) || [];
  }

  /**
   * Retrieve all audit events (for operations / security monitoring)
   */
  static async getAllAuditEvents(): Promise<AuditEvent[]> {
    const eventMap = new Map<string, AuditEvent>();

    // Include in-memory events (covers system/registry lifecycle events)
    for (const events of inMemoryAuditEvents.values()) {
      for (const ev of events) {
        eventMap.set(ev.id, ev);
      }
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!error && data && data.length > 0) {
          for (const d of data) {
            eventMap.set(d.id, {
              id: d.id,
              requestId: d.request_id,
              eventType: d.event_type,
              service: d.service,
              provider: d.provider,
              status: d.status,
              metadata: d.metadata,
              createdAt: d.created_at,
              timestamp: d.created_at
            });
          }
        }
      } catch (err) {
        console.warn('[DB] Supabase query all audit error:', err);
      }
    }

    return Array.from(eventMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

