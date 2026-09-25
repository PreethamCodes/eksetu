import { CitizenData } from './types';
import mockCitizens from '../data/citizens.json';

export interface DataProvider {
  name: string;
  getIncomeData(citizenId: string): Promise<CitizenData | null>;
}

export class MockGovernmentProvider implements DataProvider {
  name = 'Government Data Provider — Prototype';

  async getIncomeData(citizenId: string): Promise<CitizenData | null> {
    // Simulate slight network latency representing inter-department handshake
    await new Promise((resolve) => setTimeout(resolve, 350));
    
    const citizen = (mockCitizens as CitizenData[]).find(
      (c) => c.citizenId.toLowerCase() === citizenId.toLowerCase()
    );

    if (!citizen) return null;

    return {
      citizenId: citizen.citizenId,
      name: citizen.name,
      address: citizen.address,
      annualIncome: citizen.annualIncome,
      verified: citizen.verified,
      source: this.name,
    };
  }
}

export const defaultDataProvider = new MockGovernmentProvider();
