import { XmlValidator } from './xmlValidator';

export interface ParsedLegacyStudentData {
  verified: boolean;
  status: 'VERIFIED' | 'FAILED';
  studentName?: string;
  marksPercentage?: number;
  qualification?: string;
  studentStatus?: string;
  source?: string;
  error?: string;
  // Extraneous legacy fields (to demonstrate response minimization)
  internalEnrollmentId?: string;
  fullAddress?: string;
  bankAccount?: string;
  dateOfBirth?: string;
}

export class XmlParser {
  /**
   * Helper to extract the text content of a tag from an XML string.
   */
  private static extractTag(xml: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Safely parses VerifyStudentResponse XML into normalized typed internal data.
   */
  static parseStudentResponse(xmlText: string): { success: boolean; data?: ParsedLegacyStudentData; error?: string } {
    // 1. Validate structure and safety
    const validation = XmlValidator.validateStudentResponseXml(xmlText);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'XML validation failed'
      };
    }

    const status = validation.status;

    if (status !== 'VERIFIED') {
      const errorMsg = this.extractTag(xmlText, 'ErrorMessage') ||
        (status === 'RECORD_NOT_FOUND' ? 'Student record not found in Legacy Education registry' : 'Verification failed in legacy system');
      return {
        success: true,
        data: {
          verified: false,
          status: 'FAILED',
          error: errorMsg,
          source: this.extractTag(xmlText, 'Source') || 'Legacy Education Department System'
        }
      };
    }

    // 2. Extract and cast fields
    const studentName = this.extractTag(xmlText, 'StudentName');
    const marksStr = this.extractTag(xmlText, 'MarksPercentage');
    const marksPercentage = marksStr !== undefined ? Number(marksStr) : undefined;
    const qualification = this.extractTag(xmlText, 'Qualification') || "Bachelor's Degree";
    const studentStatus = this.extractTag(xmlText, 'StudentStatus') || 'GRADUATE';
    const source = this.extractTag(xmlText, 'Source') || 'Legacy Education Department System';

    // Extraneous internal registry data (subject to response minimization)
    const internalEnrollmentId = this.extractTag(xmlText, 'InternalEnrollmentId');
    const fullAddress = this.extractTag(xmlText, 'FullAddress');
    const bankAccount = this.extractTag(xmlText, 'BankAccount');
    const dateOfBirth = this.extractTag(xmlText, 'DateOfBirth');

    return {
      success: true,
      data: {
        verified: true,
        status: 'VERIFIED',
        studentName,
        marksPercentage,
        qualification,
        studentStatus,
        source,
        internalEnrollmentId,
        fullAddress,
        bankAccount,
        dateOfBirth
      }
    };
  }

  /**
   * Alias for backward and test compatibility
   */
  static parseVerifyStudentResponse(xmlText: string): {
    success: boolean;
    statusCode: string;
    student?: ParsedLegacyStudentData;
    data?: ParsedLegacyStudentData;
    error?: string;
  } {
    const res = this.parseStudentResponse(xmlText);
    const status = res.data?.status === 'VERIFIED' ? 'SUCCESS' : (res.data?.status || 'FAILED');
    return {
      success: res.success,
      statusCode: status,
      student: res.data,
      data: res.data,
      error: res.error
    };
  }
}
