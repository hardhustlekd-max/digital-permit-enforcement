import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dbWrapper } from '../config/firebase.js';

export async function getVendorBatches(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const vendorUid = req.user?.uid || 'vendor-01';
    const batches = await dbWrapper.getPrintBatchesByVendor(vendorUid);

    res.status(200).json({
      total_batches: batches.length,
      batches,
    });
  } catch (error) {
    console.error('Get vendor batches error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve vendor print batches.',
    });
  }
}

export async function acceptVendorBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { batchId } = req.params;
    await dbWrapper.updateBatchStatus(batchId, 'in_production');

    res.status(200).json({
      message: `Batch '${batchId}' status shifted to 'in_production'.`,
      batch_id: batchId,
      batch_status: 'in_production',
    });
  } catch (error) {
    console.error('Accept vendor batch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to accept batch order.',
    });
  }
}

export async function getBatchManifest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { batchId } = req.params;
    const items = await dbWrapper.getBatchItems(batchId);

    const manifestItems = [];
    for (const item of items) {
      const permit = (await dbWrapper.getAllPermits()).find(p => p.id === item.permit_id);
      let vin = '';
      let license_plate = '';

      if (permit) {
        const vehicle = await dbWrapper.getVehicleByVin(permit.vehicle_id);
        if (vehicle) {
          vin = vehicle.vin;
          license_plate = vehicle.license_plate;
        }
      }

      // STRICT PRIVACY PROTECTION: Output only structural printing data (VIN, Plate, QR Payload)
      // DO NOT leak owner_name, owner_national_id, or raw B2 photo scans to printing vendors!
      manifestItems.push({
        permit_id: item.permit_id,
        vin,
        license_plate,
        secure_qr_payload_url: item.secure_qr_payload_url,
        printing_status: item.printing_status || 'queued',
      });
    }

    res.status(200).json({
      batch_id: batchId,
      total_items: manifestItems.length,
      manifest: manifestItems,
    });
  } catch (error) {
    console.error('Get batch manifest error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate print layout manifest.',
    });
  }
}

export async function completeVendorBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { batchId } = req.params;
    await dbWrapper.updateBatchStatus(batchId, 'dispatched');

    res.status(200).json({
      message: `Batch '${batchId}' fulfillment complete. Shifted status to 'dispatched'.`,
      batch_id: batchId,
      batch_status: 'dispatched',
    });
  } catch (error) {
    console.error('Complete vendor batch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to complete batch order.',
    });
  }
}
