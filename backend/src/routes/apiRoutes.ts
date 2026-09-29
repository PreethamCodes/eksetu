import { Router } from 'express';
import { RequestController } from '../controllers/requestController';
import { ConsentController } from '../controllers/consentController';
import { PolicyController } from '../controllers/policyController';
import { validateVerificationRequest } from '../middleware/validateRequest';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', RequestController.healthCheck);

// Primary EKSetu Verification Request Endpoint (Initiates request, requires consent)
apiRouter.post('/v1/requests', validateVerificationRequest, RequestController.createVerificationRequest);

// Citizen Consent Decision Endpoint (ALLOW / DENY)
apiRouter.post('/v1/consent', ConsentController.handleConsentDecision);

// V3 Policy Engine Evaluation Endpoint (Direct evaluation & data minimization inspection)
apiRouter.post('/v1/policy/evaluate', PolicyController.evaluate);

// Request status & result lookup
apiRouter.get('/v1/requests/:requestId', RequestController.getRequestById);
