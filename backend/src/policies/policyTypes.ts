export type PolicyDecision = 'ALLOW' | 'DENY' | 'PARTIAL_ALLOW';

export type DataClassification =
  | 'EDUCATION'
  | 'INCOME'
  | 'RESIDENCE'
  | 'FINANCIAL'
  | 'MEDICAL'
  | 'VEHICLE'
  | 'GENERAL';

export type BlockedReason =
  | 'NOT_REQUIRED_FOR_PURPOSE'
  | 'PURPOSE_NOT_AUTHORIZED'
  | 'FIELD_NOT_ALLOWED'
  | 'UNKNOWN_FIELD';

export interface BlockedFieldDetail {
  field: string;
  classification: DataClassification;
  reason: BlockedReason;
  explanation: string;
}

export interface FieldEvaluationResult {
  field: string;
  decision: 'ALLOW' | 'DENY';
  classification: DataClassification;
  reason?: BlockedReason;
  explanation: string;
}

export interface PolicyEvaluationResult {
  policyId: string;
  version: string;
  service: string;
  purpose: string;
  decision: PolicyDecision;
  totalRequested: number;
  totalAllowed: number;
  totalBlocked: number;
  allowedFields: string[];
  blockedFields: BlockedFieldDetail[];
  fieldEvaluations: FieldEvaluationResult[];
  timestamp: string;
}

export interface PolicyRuleDefinition {
  policyId: string;
  service: string;
  purpose: string;
  version: string;
  status: 'ACTIVE' | 'INACTIVE';
  allowedFields: string[];
  blockedFieldsKnown: string[];
  fieldClassifications: Record<string, DataClassification>;
  description: string;
}
