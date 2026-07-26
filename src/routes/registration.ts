import { Router } from 'express';
import multer from 'multer';
import { requireRole } from '../middleware/auth.js';
import { registerVehicle, getPendingPermitVehicles } from '../controllers/vehicleController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// Registration Clerks endpoint to register vehicles with owner photo & permit scan concurrent uploads
router.post(
  '/vehicle',
  requireRole(['registration_clerk', 'super_admin']),
  upload.fields([
    { name: 'owner_photo', maxCount: 1 },
    { name: 'permit_scan', maxCount: 1 },
  ]),
  registerVehicle
);

// Query pending vehicles with no active permit
router.get(
  '/pending',
  requireRole(['registration_clerk', 'super_admin']),
  getPendingPermitVehicles
);

export default router;
