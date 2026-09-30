import { FailureSimulationConfig } from '../../models/types';
import { LegacyProviderSimulator } from './legacyProviderSimulator';

export class SoapClient {
  /**
   * Generates a well-formed SOAP/XML request envelope.
   * Note: Only fields approved by Policy Engine (data minimization) are included.
   */
  static buildVerifyStudentRequest(
    paramOrRef: any,
    applicantName?: string,
    requestedFields?: string[]
  ): string {
    let studentReference = '';
    let studentName = '';
    let fields: string[] = [];

    let qualification = '';
    if (typeof paramOrRef === 'object' && paramOrRef !== null) {
      studentReference = paramOrRef.studentReference || paramOrRef.applicationId || '';
      studentName = paramOrRef.applicantName || paramOrRef.studentName || '';
      qualification = paramOrRef.qualification || '';
      fields = paramOrRef.requestedFields || [];
    } else {
      studentReference = paramOrRef || '';
      studentName = applicantName || '';
      fields = requestedFields || [];
    }

    const fieldsXml = fields
      .map(field => `        <Field>${field}</Field>`)
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:edu="http://legacy.education.gov.in/ws">
  <soap:Header/>
  <soap:Body>
    <edu:VerifyStudentRequest>
      <ApplicationId>${studentReference}</ApplicationId>
      <edu:StudentReference>${studentReference}</edu:StudentReference>
      <StudentName>${studentName}</StudentName>
      <edu:ApplicantName>${studentName}</edu:ApplicantName>
      ${qualification ? `<Qualification>${qualification}</Qualification>` : ''}
      <edu:RequestedFields>
${fieldsXml}
      </edu:RequestedFields>
    </edu:VerifyStudentRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Sends the SOAP/XML request to the legacy service endpoint.
   */
  static async send(
    soapXml: string,
    simulation?: FailureSimulationConfig | boolean
  ): Promise<string> {
    return LegacyProviderSimulator.executeSoapCall(soapXml, simulation);
  }

  /**
   * Sanitizes XML text for audit logging or debugging (never log passwords or sensitive bank details).
   */
  static sanitizeXmlForLog(xmlText: string): string {
    return xmlText
      .replace(/<BankAccount>[\s\S]*?<\/BankAccount>/gi, '<BankAccount>[REDACTED]</BankAccount>')
      .replace(/<FullAddress>[\s\S]*?<\/FullAddress>/gi, '<FullAddress>[REDACTED]</FullAddress>');
  }
}
