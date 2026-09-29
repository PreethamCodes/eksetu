import { Router } from 'express';
import { RequestController } from '../controllers/requestController';
import { ConsentController } from '../controllers/consentController';
import { validateVerificationRequest } from '../middleware/validateRequest';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', RequestController.healthCheck);

// Primary EKSetu V2 Verification Request Endpoint (Initiates request, requires consent)
apiRouter.post('/v1/requests', validateVerificationRequest, RequestController.createVerificationRequest);

// V2 Citizen Consent Decision Endpoint (ALLOW / DENY)
apiRouter.post('/v1/consent', ConsentController.handleConsentDecision);

// Request status & result lookup
apiRouter.get('/v1/requests/:requestId', RequestController.getRequestById);
