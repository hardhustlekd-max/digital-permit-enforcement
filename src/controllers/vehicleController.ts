import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { uploadToB2 } from '../config/backblaze.js';
import { dbWrapper } from '../config/firebase.js';
import { Vehicle } from '../types.js';

export async function registerVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      vin,
      license_plate,
      engine_capacity_cc,
      is_electric,
      owner_name,
      owner_national_id,
    } = req.body;

    // Validate required fields
    if (!vin || !license_plate || !owner_name || !owner_national_id) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'VIN, License Plate, Owner Name, and Owner National ID are required.',
      });
      return;
    }

    const cleanVin = String(vin).trim().toUpperCase();
    const cleanPlate = String(license_plate).trim().toUpperCase();
    const cleanNationalId = String(owner_national_id).trim();

    if (cleanVin.length !== 17) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'VIN must be exactly 17 characters in length.',
      });
      return;
    }

    const cc = parseInt(engine_capacity_cc || '0', 10);
    const isElectric = is_electric === 'true' || is_electric === true || cc === 0;

    // Concurrently handle file streams to Backblaze B2 object storage
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    let ownerPhotoUrl = '';
    let permitScanUrl = '';

    const timestamp = Date.now();

    if (files && files['owner_photo'] && files['owner_photo'][0]) {
      const photoFile = files['owner_photo'][0];
      const photoKey = `photos/${cleanVin}_${timestamp}.jpg`;
      ownerPhotoUrl = await uploadToB2(photoFile.buffer, photoKey, photoFile.mimetype || 'image/jpeg');
    } else {
      // High quality fallback avatar
      ownerPhotoUrl = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`;
    }

    if (files && files['permit_scan'] && files['permit_scan'][0]) {
      const scanFile = files['permit_scan'][0];
      const scanKey = `permits/${cleanVin}_${timestamp}.pdf`;
      permitScanUrl = await uploadToB2(scanFile.buffer, scanKey, scanFile.mimetype || 'application/pdf');
    } else {
      permitScanUrl = `https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80`;
    }

    // Firestore Transaction Uniqueness Verification
    const existingVin = await dbWrapper.getVehicleByVin(cleanVin);
    if (existingVin) {
      res.status(409).json({
        error: 'Conflict Error',
        message: `Vehicle with VIN '${cleanVin}' is already registered in the system.`,
      });
      return;
    }

    const existingPlate = await dbWrapper.getVehicleByPlate(cleanPlate);
    if (existingPlate) {
      res.status(409).json({
        error: 'Conflict Error',
        message: `Vehicle with License Plate '${cleanPlate}' is already registered in the system.`,
      });
      return;
    }

    const vehicleRecord: Vehicle = {
      vin: cleanVin,
      license_plate: cleanPlate,
      engine_capacity_cc: cc,
      is_electric: isElectric,
      owner_name,
      owner_national_id: cleanNationalId,
      owner_photo_b2_url: ownerPhotoUrl,
      paper_permit_scan_b2_url: permitScanUrl,
      created_at: new Date().toISOString(),
    };

    await dbWrapper.saveVehicle(vehicleRecord);

    res.status(201).json({
      message: 'Vehicle successfully registered with Backblaze B2 asset streams.',
      vehicle: vehicleRecord,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Registration process failed.',
    });
  }
}

export async function getPendingPermitVehicles(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const allVehicles = await dbWrapper.getAllVehicles();
    const allPermits = await dbWrapper.getAllPermits();

    const registeredVinsWithActivePermits = new Set(
      allPermits.filter(p => p.status === 'active').map(p => p.vehicle_id)
    );

    const pendingVehicles = allVehicles.filter(v => !registeredVinsWithActivePermits.has(v.vin));

    res.status(200).json({
      total_pending: pendingVehicles.length,
      vehicles: pendingVehicles,
    });
  } catch (error) {
    console.error('Error fetching pending vehicles:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve pending vehicles.',
    });
  }
}
