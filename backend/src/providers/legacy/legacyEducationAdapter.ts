import { VerificationProvider, ProviderRequest, ProviderResult } from '../providerInterface';
import { SoapClient } from './soapClient';
import { XmlParser } from './xmlParser';
import { AuditService } from '../../services/auditService';

export class LegacyEducationAdapter implements VerificationProvider {
  readonly providerId = 'LEGACY_EDUCATION';
  readonly providerName = 'Legacy Education Department System';
  readonly department = 'Education Department';
  readonly protocol = 'SOAP_XML' as const;

  /**
   * Adapts legacy SOAP/XML communication into normalized VerificationProvider result.
   */
  async verify(request: ProviderRequest): Promise<ProviderResult> {
    const verifiedAt = new Date().toISOString();
    const requestId = request.requestId;

    try {
      // 1. Build SOAP/XML Request with Policy-Minimization applied fields only
      const soapRequestXml = SoapClient.buildVerifyStudentRequest({
        studentReference: request.applicant.applicationId || 'REF-STU-001',
        applicantName: request.applicant.name,
        qualification: request.applicant.qualification,
        requestedFields: request.requestedFields
      });

      await AuditService.recordEvent({
        requestId,
        eventType: 'LEGACY_REQUEST_BUILT',
        service: request.service,
        provider: this.providerId,
        status: 'SUCCESS',
        metadata: {
          protocol: this.protocol,
          requestedFields: request.requestedFields
        }
      });

      // 2. Transmit SOAP/XML Request
      await AuditService.recordEvent({
        requestId,
        eventType: 'LEGACY_REQUEST_SENT',
        service: request.service,
        provider: this.providerId,
        status: 'PENDING',
        metadata: {
          protocol: this.protocol,
          endpoint: 'http://legacy.education.gov.in/ws/VerifyStudent'
        }
      });

      const rawXmlResponse = await SoapClient.send(
        soapRequestXml,
        request.simulateFailure
      );

      await AuditService.recordEvent({
        requestId,
        eventType: 'LEGACY_RESPONSE_RECEIVED',
        service: request.service,
        provider: this.providerId,
        status: 'SUCCESS',
        metadata: {
          protocol: this.protocol,
          responseBytes: rawXmlResponse.length
        }
      });

      // 3. Safe Parsing & Validation of XML Payload
      const parseResult = XmlParser.parseStudentResponse(rawXmlResponse);

      if (!parseResult.success || !parseResult.data) {
        await AuditService.recordEvent({
          requestId,
          eventType: 'LEGACY_XML_VALIDATION_FAILED',
          service: request.service,
          provider: this.providerId,
          status: 'FAILED',
          metadata: {
            protocol: this.protocol,
            error: parseResult.error
          }
        });

        await AuditService.recordEvent({
          requestId,
          eventType: 'PROVIDER_INVALID_RESPONSE',
          service: request.service,
          provider: this.providerId,
          status: 'FAILED',
          metadata: {
            protocol: this.protocol,
            error: parseResult.error
          }
        });

        return {
          providerId: this.providerId,
          providerName: this.providerName,
          department: this.department,
          protocol: this.protocol,
          status: 'FAILED',
          verified: false,
          verifiedAt,
          error: `Legacy SOAP/XML response contract violation: ${parseResult.error}`
        };
      }

      await AuditService.recordEvent({
        requestId,
        eventType: 'LEGACY_XML_PARSED',
        service: request.service,
        provider: this.providerId,
        status: 'SUCCESS',
        metadata: {
          protocol: this.protocol,
          status: parseResult.data.status
        }
      });

      const parsedData = parseResult.data;

      // 4. Handle status check from parsed data
      if (parsedData.status !== 'VERIFIED') {
        await AuditService.recordEvent({
          requestId,
          eventType: 'LEGACY_PROVIDER_FAILED',
          service: request.service,
          provider: this.providerId,
          status: 'FAILED',
          metadata: {
            protocol: this.protocol,
            error: parsedData.error
          }
        });

        return {
          providerId: this.providerId,
          providerName: this.providerName,
          department: this.department,
          protocol: this.protocol,
          status: 'FAILED',
          verified: false,
          verifiedAt,
          error: parsedData.error || 'Record unverified in legacy system'
        };
      }

      // 5. Successful legacy verification
      return {
        providerId: this.providerId,
        providerName: this.providerName,
        department: this.department,
        protocol: this.protocol,
        status: 'VERIFIED',
        verified: true,
        verifiedAt,
        data: {
          verified: true,
          studentName: parsedData.studentName,
          qualification: parsedData.qualification,
          marksPercentage: parsedData.marksPercentage,
          studentStatus: parsedData.studentStatus,
          // Retain extraneous legacy fields here so PolicyService.minimizeEducationData can strip them!
          internalEnrollmentId: parsedData.internalEnrollmentId,
          fullAddress: parsedData.fullAddress,
          bankAccount: parsedData.bankAccount,
          dateOfBirth: parsedData.dateOfBirth
        }
      };
    } catch (err: any) {
      await AuditService.recordEvent({
        requestId,
        eventType: 'LEGACY_PROVIDER_FAILED',
        service: request.service,
        provider: this.providerId,
        status: 'FAILED',
        metadata: {
          protocol: this.protocol,
          error: err.message || 'Legacy adapter exception'
        }
      });

      return {
        providerId: this.providerId,
        providerName: this.providerName,
        department: this.department,
        protocol: this.protocol,
        status: 'FAILED',
        verified: false,
        verifiedAt,
        error: err.message || 'Legacy SOAP adapter failure'
      };
    }
  }
}
