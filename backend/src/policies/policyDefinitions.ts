import { PolicyRuleDefinition } from './policyTypes';

export const POLICIES: Record<string, PolicyRuleDefinition> = {
  'SCHOLARSHIP:SCHOLARSHIP_ELIGIBILITY': {
    policyId: 'SCHOLARSHIP_ELIGIBILITY',
    service: 'SCHOLARSHIP',
    purpose: 'SCHOLARSHIP_ELIGIBILITY',
    version: '1.0',
    status: 'ACTIVE',
    description: 'Enforces data minimization for National Merit Scholarship eligibility assessment',
    allowedFields: [
      'education.qualification',
      'income.annual_income',
      'residence.state',
      // backward compatibility with V1/V2 shorthand identifiers
      'education',
      'income',
      'residence'
    ],
    blockedFieldsKnown: [
      'bank.balance',
      'medical.history',
      'vehicle.details',
      'tax.full_history',
      'address.full'
    ],
    fieldClassifications: {
      'education.qualification': 'EDUCATION',
      'education': 'EDUCATION',
      'income.annual_income': 'INCOME',
      'income': 'INCOME',
      'residence.state': 'RESIDENCE',
      'residence': 'RESIDENCE',
      'bank.balance': 'FINANCIAL',
      'medical.history': 'MEDICAL',
      'vehicle.details': 'VEHICLE',
      'tax.full_history': 'FINANCIAL',
      'address.full': 'RESIDENCE'
    }
  }
};
