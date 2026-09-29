import { Router } from 'express';
import { RequestController } from '../controllers/requestController';
import { validateVerificationRequest } from '../middleware/validateRequest';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', RequestController.healthCheck);

// Primary EKSetu V1 Verification Endpoint
apiRouter.post('/v1/requests', validateVerificationRequest, RequestController.createVerificationRequest);

// Request status & result lookup
apiRouter.get('/v1/requests/:requestId', RequestController.getRequestById);
