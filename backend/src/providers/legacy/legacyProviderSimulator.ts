import { FailureSimulationConfig } from '../../models/types';

export class LegacyProviderSimulator {
  static readonly departmentName = 'Legacy Education Department System';

  /**
   * Simulates legacy SOAP/XML government backend system.
   * Receives SOAP XML envelope, evaluates simulation config, and outputs SOAP/XML response.
   */
  static async executeSoapCall(
    soapRequestXml: string,
    simulation?: FailureSimulationConfig | boolean
  ): Promise<string> {
    const rawType = typeof simulation === 'object' ? simulation.failureType : (simulation ? 'FAILURE' : 'NORMAL');
    const failureType = rawType || 'NORMAL';
    const customReason = typeof simulation === 'object' ? simulation.reason : undefined;

    // 1. Timeout simulation
    if (failureType === 'TIMEOUT') {
      const timeoutMs = Number(process.env.PROVIDER_TIMEOUT_MS || 5000);
      await new Promise(resolve => setTimeout(resolve, timeoutMs + 100));
      return `<?xml version="1.0" encoding="UTF-8"?>
<VerifyStudentResponse>
  <Status>FAILED</Status>
  <ErrorMessage>${customReason || 'Gateway timeout: Legacy mainframe did not respond'}</ErrorMessage>
  <Source>${this.departmentName}</Source>
</VerifyStudentResponse>`;
    }

    // 2. Server Error simulation (Legacy system failure)
    if (failureType === 'SERVER_ERROR' || failureType === 'FAILURE') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<VerifyStudentResponse>
  <Status>FAILED</Status>
  <ErrorMessage>${customReason || 'Internal legacy database connection error: ORA-12541'}</ErrorMessage>
  <Source>${this.departmentName}</Source>
</VerifyStudentResponse>`;
    }

    // 3. Record Not Found simulation
    if (failureType === 'RECORD_NOT_FOUND') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<VerifyStudentResponse>
  <Status>RECORD_NOT_FOUND</Status>
  <ErrorMessage>${customReason || 'Student record not found in legacy registry'}</ErrorMessage>
  <Source>${this.departmentName}</Source>
</VerifyStudentResponse>`;
    }

    // 4. Malformed XML simulation
    if (failureType === 'MALFORMED_XML' || failureType === 'MALFORMED_RESPONSE') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<VerifyStudentResponse>
  <Status>VERIFIED</Status>
  <Student>
    <StudentName>Corrupt Payload
    <!-- Missing closing tags and broken syntax -->`;
    }

    // 5. Invalid Status simulation
    if (failureType === 'INVALID_STATUS') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<VerifyStudentResponse>
  <Status>UNKNOWN_STATUS_CODE</Status>
  <Student>
    <StudentName>Demo Student</StudentName>
    <MarksPercentage>75</MarksPercentage>
  </Student>
  <Source>${this.departmentName}</Source>
</VerifyStudentResponse>`;
    }

    // Normal successful SOAP XML verification
    // Extract StudentName from SOAP request if present
    const nameMatch = soapRequestXml.match(/<ApplicantName>([^<]+)<\/ApplicantName>/) || soapRequestXml.match(/<StudentName>([^<]+)<\/StudentName>/);
    const applicantName = nameMatch ? nameMatch[1].trim() : 'Sai Preetham';
    const qualMatch = soapRequestXml.match(/<Qualification>([^<]+)<\/Qualification>/);
    const qualification = qualMatch ? qualMatch[1].trim() : "Bachelor's Degree";

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <VerifyStudentResponse>
      <Status>VERIFIED</Status>
      <Student>
        <StudentName>${applicantName}</StudentName>
        <MarksPercentage>82</MarksPercentage>
        <Qualification>${qualification}</Qualification>
        <StudentStatus>GRADUATE</StudentStatus>
        <!-- Extraneous legacy registry data (demonstrating response minimization) -->
        <InternalEnrollmentId>LEGACY-ENR-2004-9981</InternalEnrollmentId>
        <DateOfBirth>2003-05-14</DateOfBirth>
        <FullAddress>Old Secretariat Rd, Saifabad, Hyderabad, TS</FullAddress>
        <BankAccount>SBIN00041238910</BankAccount>
      </Student>
      <Source>${this.departmentName}</Source>
    </VerifyStudentResponse>
  </soap:Body>
</soap:Envelope>`;
  }
}
