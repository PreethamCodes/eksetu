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
        // Determine whether field is known extraneous field or completely unknown
        const isKnownBlocked = policy.blockedFieldsKnown.includes(normalizedField);
        const reason = isKnownBlocked ? 'NOT_REQUIRED_FOR_PURPOSE' : 'UNKNOWN_FIELD';
        const explanation = isKnownBlocked
          ? `Field '${field}' is not required for ${policy.purpose.replace(/_/g, ' ')} and is blocked by data minimization policy`
          : `Field '${field}' is unrecognized by policy engine and defaults to deny`;

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
