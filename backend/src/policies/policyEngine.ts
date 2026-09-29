import {
  BlockedFieldDetail,
  DataClassification,
  FieldEvaluationResult,
  PolicyDecision,
  PolicyEvaluationResult
} from './policyTypes';
import { POLICIES } from './policyDefinitions';

export class PolicyEngine {
  /**
   * Normalizes purpose strings (e.g., "Scholarship Eligibility" -> "SCHOLARSHIP_ELIGIBILITY")
   */
  static normalizePurpose(rawPurpose?: string): string {
    if (!rawPurpose) return 'SCHOLARSHIP_ELIGIBILITY';
    return rawPurpose.trim().toUpperCase().replace(/\s+/g, '_');
  }

  /**
   * Evaluates incoming requested fields against purpose-bound policy rules
   */
  static evaluate(
    service: string,
    rawPurpose: string,
    requestedFields: string[]
  ): PolicyEvaluationResult {
    const normalizedPurpose = this.normalizePurpose(rawPurpose);
    const policyKey = `${service.toUpperCase()}:${normalizedPurpose}`;
    const policy = POLICIES[policyKey];
    const timestamp = new Date().toISOString();

    // 1. Unknown Service or Purpose Handling (Secure default: DENY)
    if (!policy) {
      const fieldEvaluations: FieldEvaluationResult[] = requestedFields.map(field => ({
        field,
        decision: 'DENY',
        classification: 'GENERAL',
        reason: 'PURPOSE_NOT_AUTHORIZED',
        explanation: `No active policy registered for service '${service}' and purpose '${rawPurpose}'`
      }));

      const blockedFields: BlockedFieldDetail[] = fieldEvaluations.map(fe => ({
        field: fe.field,
        classification: fe.classification,
        reason: fe.reason || 'PURPOSE_NOT_AUTHORIZED',
        explanation: fe.explanation
      }));

      return {
        policyId: 'DEFAULT_RESTRICTIVE_POLICY',
        version: '1.0',
        service,
        purpose: rawPurpose,
        decision: 'DENY',
        totalRequested: requestedFields.length,
        totalAllowed: 0,
        totalBlocked: requestedFields.length,
        allowedFields: [],
        blockedFields,
        fieldEvaluations,
        timestamp
      };
    }

    // 2. Field-level Evaluation against active policy
    const fieldEvaluations: FieldEvaluationResult[] = [];
    const allowedFields: string[] = [];
    const blockedFields: BlockedFieldDetail[] = [];

    for (const field of requestedFields) {
      const normalizedField = field.trim().toLowerCase();
      const isAllowed = policy.allowedFields.includes(normalizedField);
      const classification: DataClassification =
        policy.fieldClassifications[normalizedField] || 'GENERAL';

      if (isAllowed) {
        allowedFields.push(field);
        fieldEvaluations.push({
          field,
          decision: 'ALLOW',
          classification,
          explanation: `Required for ${policy.purpose.replace(/_/g, ' ')} verification`
        });
      } else {
        // Determine specific data minimization justification reason
        let reason: any = 'NOT_REQUIRED_FOR_PURPOSE';
        let explanation = `Field '${field}' is not required for scholarship eligibility assessment`;

        if (normalizedField.includes('bank') || normalizedField.includes('balance')) {
          reason = 'EXCESSIVE_DATA';
          explanation = 'Excessive financial disclosure; annual income bracket is sufficient';
        } else if (normalizedField.includes('address')) {
          reason = 'NOT_REQUIRED_FOR_PURPOSE';
          explanation = 'Full street address not required for scholarship eligibility; domicile state is sufficient';
        } else if (normalizedField.includes('caste') || normalizedField.includes('religion')) {
          reason = 'SENSITIVE_DATA_RESTRICTED';
          explanation = 'Sensitive personal classification restricted from automated exchange';
        } else if (normalizedField.includes('medical') || normalizedField.includes('health')) {
          reason = 'NOT_REQUIRED_FOR_PURPOSE';
          explanation = 'Medical history is not required for academic scholarship eligibility assessment';
        } else if (!policy.blockedFieldsKnown.includes(normalizedField)) {
          reason = 'UNKNOWN_FIELD';
          explanation = `Field '${field}' is unrecognized by policy engine and defaults to deny`;
        }

        blockedFields.push({
          field,
          classification,
          reason,
          explanation
        });

        fieldEvaluations.push({
          field,
          decision: 'DENY',
          classification,
          reason,
          explanation
        });
      }
    }

    // 3. Compute overall decision
    let decision: PolicyDecision = 'ALLOW';
    if (allowedFields.length === 0) {
      decision = 'DENY';
    } else if (blockedFields.length > 0) {
      decision = 'PARTIAL_ALLOW';
    }

    return {
      policyId: policy.policyId,
      version: policy.version,
      service,
      purpose: policy.purpose,
      decision,
      totalRequested: requestedFields.length,
      totalAllowed: allowedFields.length,
      totalBlocked: blockedFields.length,
      allowedFields,
      blockedFields,
      fieldEvaluations,
      timestamp
    };
  }
}
