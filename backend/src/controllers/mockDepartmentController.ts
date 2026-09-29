import { Request, Response } from 'express';
import { EducationProvider } from '../providers/educationProvider';
import { RevenueProvider } from '../providers/revenueProvider';
import { ResidenceProvider } from '../providers/residenceProvider';

export class MockDepartmentController {
  /**
   * Mock Education Department API
   * POST /api/mock/education or GET /api/mock/education
   */
  static async verifyEducation(req: Request, res: Response) {
    const applicant = req.body?.applicant || {
      applicationId: (req.query.applicationId as string) || 'SCH-2026-001',
      name: (req.query.name as string) || 'Sai Preetham',
      qualification: (req.query.qualification as string) || "Bachelor's Degree"
    };

    const fail = req.body?.fail === true || req.query.fail === 'true';
    const result = await EducationProvider.verify(applicant, fail);
    res.status(result.status === 'VERIFIED' ? 200 : 400).json(result);
  }

  /**
   * Mock Revenue Department API
   * POST /api/mock/revenue or GET /api/mock/revenue
   */
  static async verifyRevenue(req: Request, res: Response) {
    const applicant = req.body?.applicant || {
      applicationId: (req.query.applicationId as string) || 'SCH-2026-001',
      name: (req.query.name as string) || 'Sai Preetham',
      annualIncome: req.query.annualIncome ? Number(req.query.annualIncome) : 180000
    };

    const fail = req.body?.fail === true || req.query.fail === 'true';
    const result = await RevenueProvider.verify(applicant, fail);
    res.status(result.status === 'VERIFIED' ? 200 : 400).json(result);
  }

  /**
   * Mock Residence Department API
   * POST /api/mock/residence or GET /api/mock/residence
   */
  static async verifyResidence(req: Request, res: Response) {
    const applicant = req.body?.applicant || {
      applicationId: (req.query.applicationId as string) || 'SCH-2026-001',
      name: (req.query.name as string) || 'Sai Preetham',
      residenceState: (req.query.state as string) || 'Telangana'
    };

    const fail = req.body?.fail === true || req.query.fail === 'true';
    const result = await ResidenceProvider.verify(applicant, fail);
    res.status(result.status === 'VERIFIED' ? 200 : 400).json(result);
  }
}
