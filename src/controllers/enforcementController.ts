import { Request, Response } from 'express';
import { dbWrapper } from '../config/firebase.js';
import { generatePermitSignature } from './adminController.js';
import { EnforcementVerifyResponse, AuditResult } from '../types.js';

export async function verifyPermitByToken(req: Request, res: Response): Promise<void> {
  try {
    const { permitTokenUuid } = req.params;
    const providedSig = String(req.query.sig || '').trim().toLowerCase();
    const officerId = String(req.query.officer_id || req.headers['x-officer-id'] || 'officer-01');
    const gpsLat = parseFloat(String(req.query.lat || req.query.gps_latitude || '13.7563')); // Default center coords
    const gpsLng = parseFloat(String(req.query.lng || req.query.gps_longitude || '100.5018'));

    const permit = await dbWrapper.getPermitByTokenUuid(permitTokenUuid);

    // If permit not found
    if (!permit) {
      const response: EnforcementVerifyResponse = {
        status: 'FRAUD_REVOKED',
        color: 'RED',
        message: 'Security Alert: Scanned QR permit UUID does not exist in the official state database.',
      };

      await dbWrapper.recordAudit({
        officer_id: officerId,
        permit_id: null,
        scanned_vin: 'UNKNOWN_VIN',
        scanned_plate: 'UNKNOWN_PLATE',
        gps_latitude: gpsLat,
        gps_longitude: gpsLng,
        audit_result: 'fraud_red' as AuditResult,
        created_at: new Date().toISOString(),
      });

      res.status(200).json(response);
      return;
    }

    const vehicle = await dbWrapper.getVehicleByVin(permit.vehicle_id);

    if (!vehicle) {
      const response: EnforcementVerifyResponse = {
        status: 'FRAUD_REVOKED',
        color: 'RED',
        message: 'Security Alert: Permit is orphaned with no matching registered vehicle record.',
      };

      await dbWrapper.recordAudit({
        officer_id: officerId,
        permit_id: permit.id,
        scanned_vin: permit.vehicle_id,
        scanned_plate: 'UNKNOWN_PLATE',
        gps_latitude: gpsLat,
        gps_longitude: gpsLng,
        audit_result: 'fraud_red' as AuditResult,
        created_at: new Date().toISOString(),
      });

      res.status(200).json(response);
      return;
    }

    // Recompute local HMAC-SHA256 signature using payload format:
    // [PermitUUID]|[VIN]|[LicensePlate]|[EngineCC]|[IsElectric]
    const expectedSig = generatePermitSignature(
      permit.permit_token_uuid,
      vehicle.vin,
      vehicle.license_plate,
      vehicle.engine_capacity_cc,
      vehicle.is_electric
    ).toLowerCase();

    // Check signature match
    if (providedSig && providedSig !== expectedSig) {
      const response: EnforcementVerifyResponse = {
        status: 'FRAUD_REVOKED',
        color: 'RED',
        message: 'CRITICAL SECURITY VIOLATION: Cryptographic HMAC signature mismatch! Sticker payload has been tampered with or forged.',
      };

      await dbWrapper.recordAudit({
        officer_id: officerId,
        permit_id: permit.id,
        scanned_vin: vehicle.vin,
        scanned_plate: vehicle.license_plate,
        gps_latitude: gpsLat,
        gps_longitude: gpsLng,
        audit_result: 'fraud_red' as AuditResult,
        created_at: new Date().toISOString(),
      });

      res.status(200).json(response);
      return;
    }

    // Check permit expiration and status
    const now = new Date();
    const expiryDate = new Date(permit.expiry_date);
    const isExpired = now > expiryDate || permit.status === 'expired' || permit.status === 'suspended';

    if (isExpired) {
      const response: EnforcementVerifyResponse = {
        status: 'EXPIRED_CANCELED',
        color: 'YELLOW',
        message: `PERMIT EXPIRED: Vehicle permit expired on ${expiryDate.toLocaleDateString()}. Roadside renewal required.`,
        vehicleData: {
          vin: vehicle.vin,
          license_plate: vehicle.license_plate,
          engine_capacity_cc: vehicle.engine_capacity_cc,
          is_electric: vehicle.is_electric,
          owner_name: vehicle.owner_name,
          owner_photo_b2_url: vehicle.owner_photo_b2_url,
          issue_date: permit.issue_date,
          expiry_date: permit.expiry_date,
          permit_status: permit.status,
        },
      };

      await dbWrapper.recordAudit({
        officer_id: officerId,
        permit_id: permit.id,
        scanned_vin: vehicle.vin,
        scanned_plate: vehicle.license_plate,
        gps_latitude: gpsLat,
        gps_longitude: gpsLng,
        audit_result: 'expired_amber' as AuditResult,
        created_at: new Date().toISOString(),
      });

      res.status(200).json(response);
      return;
    }

    // Active & Intact
    const response: EnforcementVerifyResponse = {
      status: 'VERIFIED_COMPLETE',
      color: 'GREEN',
      message: 'PERMIT VERIFIED: Fully compliant two-wheeler digital permit.',
      vehicleData: {
        vin: vehicle.vin,
        license_plate: vehicle.license_plate,
        engine_capacity_cc: vehicle.engine_capacity_cc,
        is_electric: vehicle.is_electric,
        owner_name: vehicle.owner_name,
        owner_photo_b2_url: vehicle.owner_photo_b2_url, // Required for visual face cross-verification
        issue_date: permit.issue_date,
        expiry_date: permit.expiry_date,
        permit_status: permit.status,
      },
    };

    await dbWrapper.recordAudit({
      officer_id: officerId,
      permit_id: permit.id,
      scanned_vin: vehicle.vin,
      scanned_plate: vehicle.license_plate,
      gps_latitude: gpsLat,
      gps_longitude: gpsLng,
      audit_result: 'valid_green' as AuditResult,
      created_at: new Date().toISOString(),
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Enforcement verification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process enforcement verification.',
    });
  }
}

export async function getEnforcementAudits(req: Request, res: Response): Promise<void> {
  try {
    const audits = await dbWrapper.getAudits();
    res.status(200).json({
      total_audits: audits.length,
      audits,
    });
  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch audit logs.',
    });
  }
}
