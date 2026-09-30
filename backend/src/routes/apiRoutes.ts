import { Router } from 'express';
import { RequestController } from '../controllers/requestController';
import { ConsentController } from '../controllers/consentController';
import { PolicyController } from '../controllers/policyController';
import { CitizenController } from '../controllers/citizenController';
import { ServiceController } from '../controllers/serviceController';
import { AdminController } from '../controllers/adminController';
import { ServiceAuthorization } from '../security/serviceAuthorization';
import { validateVerificationRequest, validateConsentRequest } from '../middleware/validateRequest';
import { createRateLimiter } from '../middleware/rateLimiter';

export const apiRouter = Router();

const sensitiveLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  maxRequests: Number(process.env.RATE_LIMIT_MAX || 100),
  message: 'Too many requests to verification gateway. Please try again later.'
});

// Health check endpoint
apiRouter.get('/health', RequestController.healthCheck);

// Primary EKSetu Verification Request Endpoint (Initiates request, requires consent)
apiRouter.post('/v1/requests', sensitiveLimiter, validateVerificationRequest, RequestController.createVerificationRequest);

// Citizen Consent Decision Endpoint (ALLOW / DENY)
apiRouter.post('/v1/consent', sensitiveLimiter, validateConsentRequest, ConsentController.handleConsentDecision);

// V3 Policy Engine Evaluation Endpoint (Direct evaluation & data minimization inspection)
apiRouter.post('/v1/policy/evaluate', PolicyController.evaluate);

// Request status & result lookup
apiRouter.get('/v1/requests/:requestId', RequestController.getRequestById);

// V4 Verification Audit Trail & Provenance endpoints
apiRouter.get('/v1/requests/:requestId/audit', sensitiveLimiter, RequestController.getAuditTrail);
apiRouter.get('/v1/requests/:requestId/provenance', RequestController.getProvenance);

// V5 Citizen Transparency & Data Usage Visibility endpoints
apiRouter.get('/v1/citizen/requests', CitizenController.getCitizenRequests);
apiRouter.get('/v1/citizen/requests/:requestId', CitizenController.getCitizenRequestDetail);

// V7 Provider Registry endpoint
apiRouter.get('/v1/providers', RequestController.getProviders);

// V8 Service Registry Public Endpoints
apiRouter.get('/v1/services', ServiceController.listServices);
apiRouter.get('/v1/services/:serviceId', ServiceController.getServiceDetails);
apiRouter.get('/v1/services/:serviceId/health', ServiceController.getServiceHealth);

// V8 Admin Operations Endpoints (Protected by Administrator Authorization)
apiRouter.get('/v1/admin/services', ServiceAuthorization.requireAdmin, AdminController.listAllServices);
apiRouter.post('/v1/admin/services', ServiceAuthorization.requireAdmin, AdminController.registerService);
apiRouter.patch('/v1/admin/services/:serviceId/status', ServiceAuthorization.requireAdmin, AdminController.updateServiceStatus);
apiRouter.get('/v1/admin/metrics', ServiceAuthorization.requireAdmin, AdminController.getMetrics);
apiRouter.get('/v1/admin/security/events', ServiceAuthorization.requireAdmin, AdminController.getSecurityEvents);

