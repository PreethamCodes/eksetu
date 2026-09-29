import { ApplicantInfo, MockDepartmentResponse } from '../models/types';

export interface ExtendedResidenceData {
  verified: boolean;
  domicileState: string;
  state: string;
  residenceStatus: string;
  // Extraneous internal registry data (subject to strict data minimization filtering)
  district?: string;
  fullAddress?: string;
  pincode?: string;
  propertyDetails?: string;
}

export class ResidenceProvider {
  static readonly departmentName = 'Residence Department';

  /**
   * Authoritative Municipal & Domicile Registry Simulation:
   * Looks up state residence and domicile certificates.
   */
  static async verify(
    applicant: ApplicantInfo,
    shouldFail = false
  ): Promise<MockDepartmentResponse<ExtendedResidenceData>> {
    const verifiedAt = new Date().toISOString();

    if (shouldFail) {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: 'Residence Department verification failed: Domicile record verification timed out.',
        verifiedAt
      };
    }

    const state = applicant.residenceState || 'Telangana';
    const residenceStatus = 'VALID';

    return {
      department: this.departmentName,
      status: 'VERIFIED',
      data: {
        verified: true,
        domicileState: state,
        state,
        residenceStatus,
        // Detailed PII and property records that EKSetu policy engine must filter out
        district: 'Hyderabad',
        fullAddress: 'Flat 402, Green Meadows, Madhapur, Hyderabad, Telangana 500081',
        pincode: '500081',
        propertyDetails: 'Residential Ownership'
      },
      verifiedAt
    };
  }
}
