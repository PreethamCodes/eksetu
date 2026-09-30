export type CallerRole = 'ADMIN' | 'SERVICE_CALLER' | 'AUDITOR' | 'PUBLIC';

export interface CallerIdentity {
  callerId: string;
  name: string;
  role: CallerRole;
  permissions: string[];
}

export class ServiceIdentityDirectory {
  private static identities: Map<string, CallerIdentity> = new Map();

  static {
    this.initializeIdentities();
  }

  private static initializeIdentities(): void {
    const defaultIdentities: CallerIdentity[] = [
      {
        callerId: 'ADMIN_PORTAL',
        name: 'EKSetu Operations & Administration Portal',
        role: 'ADMIN',
        permissions: ['*']
      },
      {
        callerId: 'SCHOLARSHIP_PORTAL',
        name: 'National Scholarship Gateway Service',
        role: 'SERVICE_CALLER',
        permissions: ['service:read', 'verify:request', 'verify:read']
      },
      {
        callerId: 'WELFARE_GATEWAY',
        name: 'Social Welfare Application Engine',
        role: 'SERVICE_CALLER',
        permissions: ['service:read', 'verify:request', 'verify:read']
      },
      {
        callerId: 'AUDITOR_CONSOLE',
        name: 'Independent Compliance & Audit Engine',
        role: 'AUDITOR',
        permissions: ['audit:read', 'metrics:read', 'transparency:read']
      }
    ];

    for (const identity of defaultIdentities) {
      this.identities.set(identity.callerId, identity);
    }
  }

  public static getIdentity(callerId: string): CallerIdentity | undefined {
    return this.identities.get(callerId.toUpperCase()) || this.identities.get(callerId);
  }

  public static registerIdentity(identity: CallerIdentity): void {
    this.identities.set(identity.callerId.toUpperCase(), identity);
  }
}
