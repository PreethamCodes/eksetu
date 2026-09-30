/**
 * Authoritative Simulated Citizen Registry for EkSetu Prototype
 * Simulates government departmental records to test real-world matching,
 * income verification cutoffs, domicile verification, and failure scenarios.
 */

export interface SimulatedCitizenRecord {
  applicationId: string;
  name: string;
  dob: string;
  qualification: string;
  marksPercentage: number;
  officialAnnualIncome: number;
  officialState: string;
  educationStatus?: 'VERIFIED' | 'RECORD_NOT_FOUND' | 'FAILED';
  revenueStatus?: 'VERIFIED' | 'EXPIRED' | 'TIMEOUT' | 'FAILED';
  residenceStatus?: 'VERIFIED' | 'MISMATCH' | 'FAILED';
  isLegacySoap?: boolean;
}

export const SIMULATED_CITIZENS: Record<string, SimulatedCitizenRecord> = {
  'SCH-2026-001': {
    applicationId: 'SCH-2026-001',
    name: 'Sai Preetham',
    dob: '2003-05-14',
    qualification: "Bachelor's Degree",
    marksPercentage: 82,
    officialAnnualIncome: 180000,
    officialState: 'Telangana',
    educationStatus: 'VERIFIED',
    revenueStatus: 'VERIFIED',
    residenceStatus: 'VERIFIED'
  },
  'SCH-2026-042': {
    applicationId: 'SCH-2026-042',
    name: 'Ananya Sharma',
    dob: '2004-08-21',
    qualification: 'Higher Secondary (12th)',
    marksPercentage: 91,
    officialAnnualIncome: 240000,
    officialState: 'Maharashtra',
    educationStatus: 'VERIFIED',
    revenueStatus: 'EXPIRED', // Revenue registry unverified / certificate expired
    residenceStatus: 'VERIFIED'
  },
  'SCH-2026-108': {
    applicationId: 'SCH-2026-108',
    name: 'Rohan Verma',
    dob: '2002-11-03',
    qualification: "Bachelor's Degree",
    marksPercentage: 78,
    officialAnnualIncome: 320000,
    officialState: 'Karnataka',
    educationStatus: 'VERIFIED',
    revenueStatus: 'VERIFIED',
    residenceStatus: 'VERIFIED',
    isLegacySoap: true
  },
  'SCH-2026-215': {
    applicationId: 'SCH-2026-215',
    name: 'Priya Patel',
    dob: '2003-01-19',
    qualification: "Bachelor's Degree",
    marksPercentage: 85,
    officialAnnualIncome: 150000,
    officialState: 'Andhra Pradesh',
    educationStatus: 'RECORD_NOT_FOUND', // Education record missing
    revenueStatus: 'VERIFIED',
    residenceStatus: 'VERIFIED'
  },
  'SCH-2026-309': {
    applicationId: 'SCH-2026-309',
    name: 'Vikramaditya Rao',
    dob: '2001-09-12',
    qualification: "Master's Degree",
    marksPercentage: 74,
    officialAnnualIncome: 850000, // High income exceeding standard threshold
    officialState: 'Delhi',
    educationStatus: 'VERIFIED',
    revenueStatus: 'VERIFIED',
    residenceStatus: 'VERIFIED'
  }
};

export function findSimulatedCitizen(appId?: string, name?: string): SimulatedCitizenRecord | undefined {
  if (appId && SIMULATED_CITIZENS[appId.trim()]) {
    return SIMULATED_CITIZENS[appId.trim()];
  }
  return undefined;
}
