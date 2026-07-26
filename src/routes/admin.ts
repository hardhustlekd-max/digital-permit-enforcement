import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { approvePermit, createPrintBatch } from '../controllers/adminController.js';

const router = Router();

// Admin permit approval and HMAC signing
router.post(
  '/approve-permit/:vehicleVin',
  requireRole(['super_admin']),
  approvePermit
);

// Admin print batch generation
router.post(
  '/create-batch',
  requireRole(['super_admin']),
  createPrintBatch
);

export default router;
