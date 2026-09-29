import { Router } from 'express';
import { MockDepartmentController } from '../controllers/mockDepartmentController';

export const mockRouter = Router();

// Mock Education Department
mockRouter.post('/education', MockDepartmentController.verifyEducation);
mockRouter.get('/education', MockDepartmentController.verifyEducation);

// Mock Revenue Department
mockRouter.post('/revenue', MockDepartmentController.verifyRevenue);
mockRouter.get('/revenue', MockDepartmentController.verifyRevenue);

// Mock Residence Department
mockRouter.post('/residence', MockDepartmentController.verifyResidence);
mockRouter.get('/residence', MockDepartmentController.verifyResidence);
