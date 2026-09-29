import { PolicyRuleDefinition } from './policyTypes';

export const POLICIES: Record<string, PolicyRuleDefinition> = {
  'SCHOLARSHIP:SCHOLARSHIP_ELIGIBILITY': {
    policyId: 'SCHOLARSHIP_ELIGIBILITY',
    service: 'SCHOLARSHIP',
    purpose: 'SCHOLARSHIP_ELIGIBILITY',
    version: '1.0',
    status: 'ACTIVE',
    description: 'Enforces purpose-based access control and data minimization for Scholarship Eligibility',
    allowedFields: [
      'studentname',
      'markspercentage',
      'annualincome',
      'domicilestate',
      'qualification',
      'education.qualification',
      'education.marks_percentage',
      'income.annual_income',
      'residence.state',
      'education',
      'income',
      'residence'
    ],
    blockedFieldsKnown: [
      'bankbalance',
      'bank.balance',
      'fulladdress',
      'address.full',
      'medicalhistory',
      'medical.history',
      'castecategory',
      'vehicle.details',
      'taxstatus',
      'tax.full_history'
    ],
    fieldClassifications: {
      'studentname': 'PII',
      'markspercentage': 'ACADEMIC',
      'qualification': 'ACADEMIC',
      'annualincome': 'FINANCIAL',
      'domicilestate': 'DEMOGRAPHIC',
      'education.qualification': 'ACADEMIC',
      'education.marks_percentage': 'ACADEMIC',
      'income.annual_income': 'FINANCIAL',
      'residence.state': 'DEMOGRAPHIC',
      'education': 'ACADEMIC',
      'income': 'FINANCIAL',
      'residence': 'DEMOGRAPHIC',
      'bankbalance': 'HIGHLY_CONFIDENTIAL',
      'bank.balance': 'HIGHLY_CONFIDENTIAL',
      'fulladdress': 'PII',
      'address.full': 'PII',
      'medicalhistory': 'SENSITIVE_PERSONAL',
      'medical.history': 'SENSITIVE_PERSONAL',
      'castecategory': 'SENSITIVE_PERSONAL',
      'taxstatus': 'FINANCIAL',
      'tax.full_history': 'FINANCIAL',
      'vehicle.details': 'GENERAL'
    }
  }
};
