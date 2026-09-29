import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/apiRoutes';
import { mockRouter } from './routes/mockRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend client access
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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
    version: '2.0.0',
    status: 'ACTIVE',
    capabilities: ['INTEROPERABILITY', 'CITIZEN_CONSENT', 'AUTHORIZATION'],
    endpoints: {
      health: '/api/health',
      requests: '/api/v1/requests',
      consent: '/api/v1/consent',
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
  console.log(`  EKSetu Interoperability Gateway (V2: Consent & Auth)`);
  console.log(`  Listening on port: ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Request Endpoint: http://localhost:${PORT}/api/v1/requests`);
  console.log(`  Consent Endpoint: http://localhost:${PORT}/api/v1/consent`);
  console.log(`====================================================`);
});

export default app;
