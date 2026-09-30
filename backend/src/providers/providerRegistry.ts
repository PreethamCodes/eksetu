import { VerificationProvider, ProviderRequest, ProviderResult } from './providerInterface';
import { EducationProvider } from './educationProvider';
import { RevenueProvider } from './revenueProvider';
import { ResidenceProvider } from './residenceProvider';
import { LegacyEducationAdapter } from './legacy/legacyEducationAdapter';

export class RestEducationAdapter implements VerificationProvider {
  readonly providerId = 'EDUCATION';
  readonly providerName = 'Education Department';
  readonly department = 'Education Department';
  readonly protocol = 'REST' as const;

  async verify(request: ProviderRequest): Promise<ProviderResult> {
    const res = await EducationProvider.verify(request.applicant, request.simulateFailure);
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      department: this.department,
      protocol: this.protocol,
      status: res.status,
      verified: res.status === 'VERIFIED',
      verifiedAt: res.verifiedAt,
      data: res.data,
      error: res.error
    };
  }
}

export class RestRevenueAdapter implements VerificationProvider {
  readonly providerId = 'REVENUE';
  readonly providerName = 'Revenue Department';
  readonly department = 'Revenue Department';
  readonly protocol = 'REST' as const;

  async verify(request: ProviderRequest): Promise<ProviderResult> {
    const res = await RevenueProvider.verify(request.applicant, request.simulateFailure);
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      department: this.department,
      protocol: this.protocol,
      status: res.status,
      verified: res.status === 'VERIFIED',
      verifiedAt: res.verifiedAt,
      data: res.data,
      error: res.error
    };
  }
}

export class RestResidenceAdapter implements VerificationProvider {
  readonly providerId = 'RESIDENCE';
  readonly providerName = 'Residence Department';
  readonly department = 'Residence Department';
  readonly protocol = 'REST' as const;

  async verify(request: ProviderRequest): Promise<ProviderResult> {
    const res = await ResidenceProvider.verify(request.applicant, request.simulateFailure);
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      department: this.department,
      protocol: this.protocol,
      status: res.status,
      verified: res.status === 'VERIFIED',
      verifiedAt: res.verifiedAt,
      data: res.data,
      error: res.error
    };
  }
}

export class ProviderRegistry {
  private static providers: Map<string, VerificationProvider> = new Map<string, VerificationProvider>([
    ['EDUCATION', new RestEducationAdapter()],
    ['LEGACY_EDUCATION', new LegacyEducationAdapter()],
    ['REVENUE', new RestRevenueAdapter()],
    ['RESIDENCE', new RestResidenceAdapter()]
  ]);

  static getProvider(id: string): VerificationProvider | undefined {
    return this.providers.get(id);
  }

  static getProvidersForDepartment(department: string): VerificationProvider[] {
    return Array.from(this.providers.values()).filter(p =>
      p.department.toLowerCase() === department.toLowerCase()
    );
  }

  static getAllProviders() {
    return Array.from(this.providers.values()).map(p => ({
      id: p.providerId,
      name: p.providerName,
      department: p.department,
      protocol: p.protocol,
      active: true
    }));
  }

  /**
   * Authoritative server-side provider selection.
   * Defaults to modern REST unless explicitly requested and permitted.
   */
  static selectEducationProvider(request: any): VerificationProvider {
    const rawApplicant = request?.applicant_data || request?.applicant || {};
    const rawSim = request?.simulateFailure || rawApplicant?.simulateFailure || (request as any)?.simulate_failure;

    let preferred =
      request?.providerSelection ||
      request?.preferredProvider ||
      rawApplicant?.preferredProvider ||
      rawApplicant?.providerSelection ||
      (typeof rawSim === 'object' ? rawSim?.providerId : undefined);

    if (typeof preferred === 'object' && preferred !== null) {
      preferred = preferred.education || preferred.providerId;
    }

    if (preferred === 'LEGACY_EDUCATION') {
      return this.providers.get('LEGACY_EDUCATION')!;
    }
    return this.providers.get('EDUCATION')!;
  }
}
