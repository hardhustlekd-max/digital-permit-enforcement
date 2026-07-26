import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import {
  getVendorBatches,
  acceptVendorBatch,
  getBatchManifest,
  completeVendorBatch,
} from '../controllers/vendorController.js';

const router = Router();

// Get batches assigned to vendor
router.get(
  '/batches',
  requireRole(['printing_provider', 'super_admin']),
  getVendorBatches
);

// Accept batch order -> in_production
router.post(
  '/batch/:batchId/accept',
  requireRole(['printing_provider', 'super_admin']),
  acceptVendorBatch
);

// Get sanitized printing manifest (No PII / B2 raw images leaked)
router.get(
  '/batch/:batchId/manifest',
  requireRole(['printing_provider', 'super_admin']),
  getBatchManifest
);

// Complete batch fulfillment -> dispatched
router.post(
  '/batch/:batchId/complete',
  requireRole(['printing_provider', 'super_admin']),
  completeVendorBatch
);

export default router;
