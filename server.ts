import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import registrationRoutes from './src/routes/registration.js';
import adminRoutes from './src/routes/admin.ts';
import vendorRoutes from './src/routes/vendor.ts';
import enforcementRoutes from './src/routes/enforcement.ts';
import { localFileMap } from './src/config/backblaze.js';
import { dbWrapper } from './src/config/firebase.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-Role, X-Officer-Id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Serve Fallback Files for local uploads
app.get('/api/storage/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const inMemory = localFileMap.get(filename);
  
  if (inMemory) {
    res.setHeader('Content-Type', inMemory.mimeType);
    res.send(inMemory.buffer);
    return;
  }

  const diskPath = path.join(process.cwd(), 'uploads_fallback', filename);
  if (fs.existsSync(diskPath)) {
    res.sendFile(diskPath);
    return;
  }

  res.status(404).send('File not found');
});

// System Health API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Digital QR-Code Permit & Enforcement Infrastructure',
    timestamp: new Date().toISOString(),
  });
});

// Seed Initial Sample Data API Endpoint
app.post('/api/seed', async (req, res) => {
  try {
    const vin1 = '1HGCR2F83HA000101';
    const vin2 = '1HGCR2F83HA000102';

    // Seed Sample Vehicles
    await dbWrapper.saveVehicle({
      vin: vin1,
      license_plate: 'BK-101-EV',
      engine_capacity_cc: 0,
      is_electric: true,
      owner_name: 'Alex Rivera',
      owner_national_id: 'ID-883920192',
      owner_photo_b2_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      paper_permit_scan_b2_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    });

    await dbWrapper.saveVehicle({
      vin: vin2,
      license_plate: 'TP-909-CC',
      engine_capacity_cc: 105,
      is_electric: false,
      owner_name: 'Marcus Chen',
      owner_national_id: 'ID-992010482',
      owner_photo_b2_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      paper_permit_scan_b2_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    });

    res.json({ message: 'Sample vehicles seeded successfully.', vins: [vin1, vin2] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Mount Module Routes
app.use('/api/register', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/enforcement', enforcementRoutes);

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Digital Permit Platform listening on http://0.0.0.0:${PORT}`);
  });
}

start();
