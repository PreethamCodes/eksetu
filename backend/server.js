const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory fallback if DATABASE_URL is not provided
const memoryRequests = new Map();
let memoryCounter = 1;
const mockCitizens = [
  {
    citizenId: 'CIT-001',
    name: 'Rahul Kumar',
    address: 'Hyderabad, Telangana',
    annualIncome: 450000,
    verified: true,
    source: 'Government Data Provider — Prototype',
  },
  {
    citizenId: 'CIT-002',
    name: 'Priya Sharma',
    address: 'Bengaluru, Karnataka',
    annualIncome: 620000,
    verified: true,
    source: 'Government Data Provider — Prototype',
  },
];

// Supabase PostgreSQL Pool (if DATABASE_URL is present)
let pool = null;
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    console.log('Connected to Supabase PostgreSQL');
  } catch (err) {
    console.error('Failed to initialize database pool, using in-memory store:', err.message);
    pool = null;
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'EkSetu Backend API',
    status: 'ONLINE',
    version: 'V1.0',
    database: pool ? 'Supabase PostgreSQL' : 'In-Memory Store',
  });
});

// 1. POST /api/request -> Create Service Request Ticket
app.post('/api/request', async (req, res) => {
  try {
    const { service, citizenId, purpose } = req.body;
    if (!service || !purpose) {
      return res.status(400).json({ error: 'Missing service or purpose', code: 'INVALID_INPUT' });
    }

    const cid = citizenId || 'CIT-001';

    if (pool) {
      const countRes = await pool.query('SELECT COUNT(*) FROM service_requests').catch(() => ({ rows: [{ count: 0 }] }));
      const count = parseInt(countRes.rows[0].count, 10) + 1;
      const requestId = `EK-2026-${String(count).padStart(5, '0')}`;

      await pool.query(
        `INSERT INTO service_requests (request_id, service, citizen_id, purpose, status, consent)
         VALUES ($1, $2, $3, $4, 'PENDING', 'PENDING')
         ON CONFLICT (request_id) DO NOTHING`,
        [requestId, service, cid, purpose]
      );

      return res.status(201).json({ requestId, status: 'PENDING' });
    } else {
      const requestId = `EK-2026-${String(memoryCounter++).padStart(5, '0')}`;
      const record = {
        requestId,
        service,
        citizenId: cid,
        purpose,
        status: 'PENDING',
        consent: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      memoryRequests.set(requestId, record);
      return res.status(201).json({ requestId, status: 'PENDING' });
    }
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// 2. POST /api/consent -> Record Citizen Consent
app.post('/api/consent', async (req, res) => {
  try {
    const { requestId, consent } = req.body;
    if (!requestId || typeof consent !== 'boolean') {
      return res.status(400).json({ error: 'Invalid input', code: 'INVALID_INPUT' });
    }

    const consentStatus = consent ? 'GRANTED' : 'DENIED';
    const reqStatus = consent ? 'APPROVED' : 'FAILED';

    if (pool) {
      const updateRes = await pool.query(
        `UPDATE service_requests SET consent = $1, status = $2 WHERE request_id = $3 RETURNING *`,
        [consentStatus, reqStatus, requestId]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'Request ticket not found' });
      }

      return res.json({ requestId, consent: consentStatus, status: reqStatus });
    } else {
      let record = memoryRequests.get(requestId);
      if (!record && /^EK-2026-\d{5}$/.test(requestId)) {
        record = {
          requestId,
          service: 'income-certificate',
          citizenId: 'CIT-001',
          purpose: 'Income Certificate Application',
          status: 'PENDING',
          consent: 'PENDING',
        };
      }

      if (!record) {
        return res.status(404).json({ error: 'Request ticket not found' });
      }

      record.consent = consentStatus;
      record.status = reqStatus;
      memoryRequests.set(requestId, record);

      return res.json({ requestId, consent: consentStatus, status: reqStatus });
    }
  } catch (err) {
    console.error('Error recording consent:', err);
    res.status(500).json({ error: 'Failed to process consent' });
  }
});

// 3. GET /api/provider/income/:citizenId -> Mock Department Provider
app.get('/api/provider/income/:citizenId', async (req, res) => {
  try {
    const { citizenId } = req.params;

    if (pool) {
      const q = await pool.query(
        'SELECT citizen_id as "citizenId", name, address, annual_income as "annualIncome", verified, source FROM mock_citizens WHERE LOWER(citizen_id) = LOWER($1)',
        [citizenId]
      );
      if (q.rows.length > 0) {
        const row = q.rows[0];
        row.annualIncome = parseFloat(row.annualIncome);
        return res.json(row);
      }
    }

    const citizen = mockCitizens.find((c) => c.citizenId.toLowerCase() === citizenId.toLowerCase());
    if (!citizen) {
      return res.status(404).json({ error: 'Citizen record not found' });
    }

    res.json(citizen);
  } catch (err) {
    console.error('Provider error:', err);
    res.status(500).json({ error: 'Data provider error' });
  }
});

// 4. POST /api/verify -> Verification Engine
app.post('/api/verify', async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    let reqRecord = null;
    if (pool) {
      const q = await pool.query('SELECT * FROM service_requests WHERE request_id = $1', [requestId]);
      if (q.rows.length > 0) reqRecord = q.rows[0];
    } else {
      reqRecord = memoryRequests.get(requestId);
      if (!reqRecord && /^EK-2026-\d{5}$/.test(requestId)) {
        reqRecord = {
          requestId,
          service: 'income-certificate',
          citizenId: 'CIT-001',
          purpose: 'Income Certificate Application',
          consent: 'GRANTED',
          status: 'APPROVED',
        };
      }
    }

    if (!reqRecord) {
      return res.status(404).json({ error: 'Request ticket not found' });
    }

    const consentVal = reqRecord.consent;
    if (consentVal !== 'GRANTED') {
      return res.status(403).json({ error: 'Citizen consent has not been granted' });
    }

    const citizenId = reqRecord.citizen_id || reqRecord.citizenId || 'CIT-001';
    let citizenData = null;

    if (pool) {
      const pq = await pool.query('SELECT * FROM mock_citizens WHERE LOWER(citizen_id) = LOWER($1)', [citizenId]);
      if (pq.rows.length > 0) {
        const row = pq.rows[0];
        citizenData = {
          name: row.name,
          address: row.address,
          annualIncome: parseFloat(row.annual_income),
          source: row.source,
        };
      }
    }

    if (!citizenData) {
      const found = mockCitizens.find((c) => c.citizenId.toLowerCase() === citizenId.toLowerCase()) || mockCitizens[0];
      citizenData = {
        name: found.name,
        address: found.address,
        annualIncome: found.annualIncome,
        source: found.source,
      };
    }

    const verifiedRecord = {
      name: citizenData.name,
      address: citizenData.address,
      annualIncome: citizenData.annualIncome,
    };

    if (pool) {
      await pool.query(
        `UPDATE service_requests 
         SET status = 'VERIFIED', verified_at = CURRENT_TIMESTAMP, data = $1, source = $2 
         WHERE request_id = $3`,
        [JSON.stringify(verifiedRecord), citizenData.source, requestId]
      ).catch(() => {});
    } else {
      reqRecord.status = 'VERIFIED';
      reqRecord.data = verifiedRecord;
      reqRecord.source = citizenData.source;
      memoryRequests.set(requestId, reqRecord);
    }

    res.json({
      requestId,
      status: 'VERIFIED',
      data: verifiedRecord,
      source: citizenData.source,
      technicalDetails: {
        requestId,
        service: reqRecord.service || 'income-certificate',
        consent: 'GRANTED',
        provider: citizenData.source,
        verification: 'SUCCESS',
        responseStatus: 200,
      },
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// 5. GET /api/request/:requestId -> Get status
app.get('/api/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    if (pool) {
      const q = await pool.query('SELECT * FROM service_requests WHERE request_id = $1', [requestId]);
      if (q.rows.length > 0) return res.json(q.rows[0]);
    }
    const mem = memoryRequests.get(requestId);
    if (mem) return res.json(mem);

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

app.listen(port, () => {
  console.log(`EkSetu Backend API running on port ${port}`);
});
