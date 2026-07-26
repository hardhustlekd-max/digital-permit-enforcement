import { Response } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dbWrapper } from '../config/firebase.js';
import { Permit } from '../types.js';

const SYSTEM_HMAC_KEY = process.env.SYSTEM_HMAC_KEY || 'secret_permit_signing_key_2026_super_secure';

/**
 * Calculates cryptographic HMAC-SHA256 signature for verification payload string
 * Exact format: [PermitUUID]|[VIN]|[LicensePlate]|[EngineCC]|[IsElectric]
 */
export function generatePermitSignature(
  permitUuid: string,
  vin: string,
  licensePlate: string,
  engineCc: number,
  isElectric: boolean
): string {
  const payload = `${permitUuid}|${vin}|${licensePlate}|${engineCc}|${isElectric}`;
  return crypto.createHmac('sha256', SYSTEM_HMAC_KEY).update(payload).digest('hex');
}

export async function approvePermit(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { vehicleVin } = req.params;
    const cleanVin = vehicleVin.trim().toUpperCase();

    const vehicle = await dbWrapper.getVehicleByVin(cleanVin);
    if (!vehicle) {
      res.status(404).json({
        error: 'Not Found',
        message: `Vehicle with VIN '${cleanVin}' was not found.`,
      });
      return;
    }

    // Check if an active permit already exists
    const existingPermit = await dbWrapper.getPermitByVehicleVin(cleanVin);
    if (existingPermit && existingPermit.status === 'active') {
      res.status(409).json({
        error: 'Conflict Error',
        message: `An active permit already exists for VIN '${cleanVin}'.`,
        permit: existingPermit,
      });
      return;
    }

    const permitUuid = crypto.randomUUID();
    const salt = crypto.randomBytes(8).toString('hex');

    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1-year permit validity

    const hmacSig = generatePermitSignature(
      permitUuid,
      vehicle.vin,
      vehicle.license_plate,
      vehicle.engine_capacity_cc,
      vehicle.is_electric
    );

    const newPermit: Permit = {
      id: `permit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      vehicle_id: vehicle.vin,
      permit_token_uuid: permitUuid,
      issue_date: issueDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: 'active',
      cryptographic_salt: salt,
      hmac_signature: hmacSig,
      updated_at: new Date().toISOString(),
    };

    await dbWrapper.savePermit(newPermit);

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl.replace(/\/$/, '')}/api/enforcement/verify/${permitUuid}?sig=${hmacSig}`;
    
    // Generate QR Base64 stream
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });

    res.status(201).json({
      message: 'Permit approved and cryptographically signed successfully.',
      permit: newPermit,
      verification_url: verifyUrl,
      qr_code_base64: qrDataUrl,
    });
  } catch (error) {
    console.error('Approve permit error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to approve permit.',
    });
  }
}

export async function createPrintBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { assigned_vendor_id } = req.body;
    const vendorUid = assigned_vendor_id || 'vendor-01';

    const allPermits = await dbWrapper.getAllPermits();
    const activePermits = allPermits.filter(p => p.status === 'active');

    // Find permits not yet grouped into job items
    const allBatches = await dbWrapper.getAllPrintBatches();
    const groupedPermitIds = new Set<string>();

    for (const batch of allBatches) {
      const items = await dbWrapper.getBatchItems(batch.id);
      items.forEach(i => groupedPermitIds.add(i.permit_id));
    }

    const unprintedPermits = activePermits.filter(p => !groupedPermitIds.has(p.id));

    if (unprintedPermits.length === 0) {
      res.status(400).json({
        error: 'No Unprinted Permits',
        message: 'There are no active approved permits waiting for print queue batching.',
      });
      return;
    }

    const batchIdentifier = `BATCH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const jobItems = [];
    for (const permit of unprintedPermits) {
      const vehicle = await dbWrapper.getVehicleByVin(permit.vehicle_id);
      const hmacSig = permit.hmac_signature || (vehicle ? generatePermitSignature(
        permit.permit_token_uuid,
        vehicle.vin,
        vehicle.license_plate,
        vehicle.engine_capacity_cc,
        vehicle.is_electric
      ) : '');

      const verifyUrl = `${appUrl.replace(/\/$/, '')}/api/enforcement/verify/${permit.permit_token_uuid}?sig=${hmacSig}`;

      jobItems.push({
        permit_id: permit.id,
        secure_qr_payload_url: verifyUrl,
        printing_status: 'queued',
      });
    }

    const newBatch = await dbWrapper.createPrintBatch({
      batch_identifier: batchIdentifier,
      created_by: req.user?.uid || 'admin-01',
      total_stickers: jobItems.length,
      batch_status: 'pending_acceptance',
      assigned_vendor_id: vendorUid,
      created_at: new Date().toISOString(),
    }, jobItems);

    res.status(201).json({
      message: 'Print batch successfully created and dispatched to vendor queue.',
      batch: newBatch,
      queued_stickers_count: jobItems.length,
    });
  } catch (error) {
    console.error('Create print batch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create print batch.',
    });
  }
}
