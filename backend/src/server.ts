import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/apiRoutes';
import { mockRouter } from './routes/mockRoutes';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders } from './middleware/securityHeaders';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(securityHeaders);

// Middleware
app.use(cors({
  origin: '*', // Allow frontend client access
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-applicant-id',
    'x-citizen-id',
    'x-user-role',
    'X-Applicant-Id',
    'X-Citizen-Id',
    'X-User-Role',
    'x-bypass-rate-limit'
  ]
}));
// Strict payload limit: 100kb to mitigate oversized payload attacks
app.use(express.json({ limit: '100kb' }));

// Request logger for auditability (no sensitive data logged)
app.use((req, res, next) => {
  console.log(`[EKSetu Gateway] ${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// Root welcome / health
app.get('/', (req, res) => {
  res.json({
    message: 'EKSetu Government Interoperability Gateway API',
    tagline: 'Share Proof, Not Databases.',
    version: '6.0.0',
    status: 'ACTIVE',
    capabilities: [
      'INTEROPERABILITY',
      'CITIZEN_CONSENT',
      'AUTHORIZATION',
      'POLICY_ENGINE',
      'DATA_MINIMIZATION',
      'PROVENANCE',
      'AUDIT_TRAIL',
      'CITIZEN_TRANSPARENCY',
      'FAILURE_HANDLING',
      'SECURITY_RESILIENCE',
      'SAFE_FAILURE',
      'CONTRACT_VALIDATION',
      'RATE_LIMITING'
    ],
    endpoints: {
      health: '/api/health',
      requests: '/api/v1/requests',
      consent: '/api/v1/consent',
      policyEvaluate: '/api/v1/policy/evaluate',
      requestAudit: '/api/v1/requests/:requestId/audit',
      requestProvenance: '/api/v1/requests/:requestId/provenance',
      citizenRequests: '/api/v1/citizen/requests',
      citizenRequestDetail: '/api/v1/citizen/requests/:requestId',
      mockEducation: '/api/mock/education',
      mockRevenue: '/api/mock/revenue',
      mockResidence: '/api/mock/residence'
    }
  });
});

// Mount Routes
app.use('/api', apiRouter);
app.use('/api/mock', mockRouter);

// Centralized error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  EKSetu Interoperability Gateway (V3: Policy & Minimization)`);
  console.log(`  Listening on port: ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Request Endpoint: http://localhost:${PORT}/api/v1/requests`);
  console.log(`  Consent Endpoint: http://localhost:${PORT}/api/v1/consent`);
  console.log(`  Policy Evaluate:  http://localhost:${PORT}/api/v1/policy/evaluate`);
  console.log(`====================================================`);
});

export default app;
