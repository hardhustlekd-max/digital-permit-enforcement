export type UserRole = 'super_admin' | 'registration_clerk' | 'printing_provider' | 'traffic_officer';

export interface UserProfile {
  uid: string;
  username: string;
  role: UserRole;
  badge_number?: string;
  created_at: string;
}

export interface Vehicle {
  vin: string; // 17-char
  license_plate: string; // Unique
  engine_capacity_cc: number; // 0 denotes EV
  is_electric: boolean;
  owner_name: string;
  owner_national_id: string; // Unique
  owner_photo_b2_url: string; // Backblaze B2 Public URL
  paper_permit_scan_b2_url: string; // Backblaze B2 Public URL
  created_at: string;
}

export type PermitStatus = 'active' | 'suspended' | 'expired';

export interface Permit {
  id: string;
  vehicle_id: string; // VIN Reference
  permit_token_uuid: string; // UUID string
  issue_date: string;
  expiry_date: string;
  status: PermitStatus;
  cryptographic_salt: string;
  hmac_signature: string;
  updated_at: string;
}

export type BatchStatus = 'pending_acceptance' | 'in_production' | 'completed' | 'dispatched';

export interface PrintBatch {
  id: string;
  batch_identifier: string;
  created_by: string; // User UID
  total_stickers: number;
  batch_status: BatchStatus;
  assigned_vendor_id: string; // User UID
  created_at: string;
}

export type PrintingStatus = 'queued' | 'printed' | 'rejected';

export interface PrintJobItem {
  id: string;
  batch_id: string;
  permit_id: string;
  secure_qr_payload_url: string;
  printing_status: PrintingStatus;
}

export type AuditResult = 'valid_green' | 'expired_amber' | 'fraud_red';

export interface EnforcementAudit {
  id: string;
  officer_id: string;
  permit_id: string | null;
  scanned_vin: string;
  scanned_plate: string;
  gps_latitude: number;
  gps_longitude: number;
  audit_result: AuditResult;
  created_at: string;
}

export interface EnforcementVerifyResponse {
  status: 'VERIFIED_COMPLETE' | 'EXPIRED_CANCELED' | 'FRAUD_REVOKED';
  color: 'GREEN' | 'YELLOW' | 'RED';
  message: string;
  vehicleData?: {
    vin: string;
    license_plate: string;
    engine_capacity_cc: number;
    is_electric: boolean;
    owner_name: string;
    owner_photo_b2_url: string;
    issue_date: string;
    expiry_date: string;
    permit_status: string;
  };
}
