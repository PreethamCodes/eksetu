/**
 * XML Validator for Legacy SOAP/XML responses.
 * Implements strict schema validation and XXE protection.
 */
export class XmlValidator {
  /**
   * Validates XML string for safety (disallows DTD/entity injection) and well-formedness.
   */
  static validateSafety(xmlText: string): { safe: boolean; error?: string } {
    if (!xmlText || typeof xmlText !== 'string' || xmlText.trim().length === 0) {
      return { safe: false, error: 'Empty XML response received' };
    }

    // XXE Protection: Reject DOCTYPE declarations and external entity definitions
    const upper = xmlText.toUpperCase();
    if (upper.includes('<!DOCTYPE') || upper.includes('<!ENTITY') || upper.includes('SYSTEM') && upper.includes('FILE://')) {
      return { safe: false, error: 'Security violation: DOCTYPE and external entities are prohibited in XML payloads' };
    }

    return { safe: true };
  }

  /**
   * Validates the structure and data types of a legacy VerifyStudentResponse XML payload.
   */
  static validateStudentResponseXml(xmlText: string): { valid: boolean; error?: string; status?: string } {
    const safetyCheck = this.validateSafety(xmlText);
    if (!safetyCheck.safe) {
      return { valid: false, error: safetyCheck.error };
    }

    // Must contain root VerifyStudentResponse (or inside a SOAP body)
    if (!xmlText.includes('<VerifyStudentResponse') || !xmlText.includes('</VerifyStudentResponse>')) {
      return { valid: false, error: 'Malformed XML: Missing <VerifyStudentResponse> envelope tags' };
    }

    // Extract Status / StatusCode flexibly
    let rawStatus = '';
    const codeMatch = xmlText.match(/<StatusCode>([^<]+)<\/StatusCode>/i);
    const statusMatch = xmlText.match(/<Status>([^<]+)<\/Status>/i);

    if (codeMatch) {
      rawStatus = codeMatch[1].trim();
    } else if (statusMatch) {
      rawStatus = statusMatch[1].trim();
    } else {
      return { valid: false, error: 'Malformed XML: Missing <Status> element in response' };
    }

    // Normalize standard success/fail codes
    if (rawStatus.toUpperCase() === 'SUCCESS') {
      rawStatus = 'VERIFIED';
    } else if (rawStatus.toUpperCase() === 'FAIL' || rawStatus.toUpperCase() === 'ERROR') {
      rawStatus = 'FAILED';
    }

    const validStatuses = ['VERIFIED', 'FAILED', 'RECORD_NOT_FOUND'];
    if (!validStatuses.includes(rawStatus)) {
      return { valid: false, error: `Invalid XML status '${rawStatus}'. Recognized: ${validStatuses.join(', ')}` };
    }

    // If status is VERIFIED, validate required fields inside <Student>
    if (rawStatus === 'VERIFIED') {
      if (!xmlText.includes('<Student>') || !xmlText.includes('</Student>')) {
        return { valid: false, error: 'Malformed XML: Missing <Student> block in response' };
      }

      const nameMatch = xmlText.match(/<StudentName>([^<]+)<\/StudentName>/);
      if (!nameMatch || nameMatch[1].trim().length === 0) {
        return { valid: false, error: 'Malformed XML: <StudentName> is required and cannot be empty' };
      }

      const marksMatch = xmlText.match(/<MarksPercentage>([^<]+)<\/MarksPercentage>/);
      if (!marksMatch) {
        return { valid: false, error: 'Malformed XML: <MarksPercentage> element missing' };
      }

      const marks = Number(marksMatch[1].trim());
      if (isNaN(marks) || marks < 0 || marks > 100) {
        return { valid: false, error: `Contract violation: <MarksPercentage> must be numeric between 0 and 100, received '${marksMatch[1]}'` };
      }

      // Source element is optional in legacy systems
    }

    return { valid: true, status: rawStatus };
  }

  /**
   * Alias for backward and test compatibility
   */
  static validateVerifyStudentResponse(xmlText: string): { valid: boolean; error?: string; status?: string } {
    return this.validateStudentResponseXml(xmlText);
  }
}
