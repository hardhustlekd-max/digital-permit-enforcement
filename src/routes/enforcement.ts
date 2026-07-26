import { Router } from 'express';
import { verifyPermitByToken, getEnforcementAudits } from '../controllers/enforcementController.js';

const router = Router();

// Public-facing verification endpoint accessed directly by smartphone cameras or PWA scanner
router.get('/verify/:permitTokenUuid', verifyPermitByToken);

// Enforcement audit logs
router.get('/audits', getEnforcementAudits);

export default router;
