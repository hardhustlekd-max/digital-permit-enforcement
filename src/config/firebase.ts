import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

try {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('[Firebase Admin] Initialized with Service Account credential.');
    } else {
      initializeApp({
        projectId: projectId || 'digital-permit-app',
      });
      console.log('[Firebase Admin] Initialized with default project config.');
    }
  }

  firestoreDb = getFirestore();
  firebaseAuth = getAuth();
} catch (error) {
  console.warn('[Firebase Admin] Initialization notice:', error instanceof Error ? error.message : error);
}

export { firestoreDb, firebaseAuth };

// In-Memory & Local Disk Persistence Layer for high-resilience execution
const dbFile = path.join(process.cwd(), '.data_store.json');

interface LocalStorageSchema {
  users: Record<string, any>;
  vehicles: Record<string, any>; // keyed by VIN
  permits: Record<string, any>; // keyed by permit ID
  print_batches: Record<string, any>; // keyed by batch ID
  print_job_items: Record<string, any>; // keyed by job item ID
  enforcement_audits: Record<string, any>; // keyed by audit ID
}

function loadLocalStore(): LocalStorageSchema {
  try {
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading local store:', err);
  }
  return {
    users: {
      'clerk-01': { uid: 'clerk-01', username: 'Clerk.Sarah', role: 'registration_clerk', created_at: new Date().toISOString() },
      'admin-01': { uid: 'admin-01', username: 'SuperAdmin.David', role: 'super_admin', badge_number: 'HQ-99', created_at: new Date().toISOString() },
      'vendor-01': { uid: 'vendor-01', username: 'SecurePrintVendor.Inc', role: 'printing_provider', badge_number: 'PRT-881', created_at: new Date().toISOString() },
      'officer-01': { uid: 'officer-01', username: 'Officer.John.Doe', role: 'traffic_officer', badge_number: 'TP-4021', created_at: new Date().toISOString() },
    },
    vehicles: {},
    permits: {},
    print_batches: {},
    print_job_items: {},
    enforcement_audits: {},
  };
}

let localStoreData: LocalStorageSchema = loadLocalStore();

function saveLocalStore() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(localStoreData, null, 2));
  } catch (err) {
    console.error('Error writing local store:', err);
  }
}

/**
 * Universal Database Wrapper providing full Firestore API compatibility with automated local persistence fallback.
 */
export const dbWrapper = {
  // Vehicles Collection
  async getVehicleByVin(vin: string) {
    if (firestoreDb) {
      try {
        const doc = await firestoreDb.collection('vehicles').doc(vin).get();
        if (doc.exists) return doc.data();
      } catch (e) {
        // Fallback
      }
    }
    return localStoreData.vehicles[vin] || null;
  },

  async getVehicleByPlate(plate: string) {
    const cleanPlate = plate.trim().toUpperCase();
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('vehicles').where('license_plate', '==', cleanPlate).limit(1).get();
        if (!snapshot.empty) return snapshot.docs[0].data();
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.vehicles).find(v => v.license_plate?.toUpperCase() === cleanPlate) || null;
  },

  async getVehicleByNationalId(nationalId: string) {
    const cleanId = nationalId.trim();
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('vehicles').where('owner_national_id', '==', cleanId).limit(1).get();
        if (!snapshot.empty) return snapshot.docs[0].data();
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.vehicles).find(v => v.owner_national_id === cleanId) || null;
  },

  async saveVehicle(vehicle: any) {
    if (firestoreDb) {
      try {
        await firestoreDb.collection('vehicles').doc(vehicle.vin).set(vehicle);
      } catch (e) {
        // Fallback
      }
    }
    localStoreData.vehicles[vehicle.vin] = vehicle;
    saveLocalStore();
    return vehicle;
  },

  async getAllVehicles() {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('vehicles').get();
        if (!snapshot.empty) return snapshot.docs.map(d => d.data());
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.vehicles);
  },

  // Permits Collection
  async getPermitByVehicleVin(vin: string) {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('permits').where('vehicle_id', '==', vin).get();
        if (!snapshot.empty) {
          const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).find((p: any) => p.status === 'active');
          return active || snapshot.docs[0].data();
        }
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.permits).find((p: any) => p.vehicle_id === vin && p.status === 'active') || null;
  },

  async getPermitByTokenUuid(permitTokenUuid: string) {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('permits').where('permit_token_uuid', '==', permitTokenUuid).limit(1).get();
        if (!snapshot.empty) {
          return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        }
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.permits).find((p: any) => p.permit_token_uuid === permitTokenUuid) || null;
  },

  async savePermit(permit: any) {
    const id = permit.id || `permit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullPermit = { ...permit, id };
    if (firestoreDb) {
      try {
        await firestoreDb.collection('permits').doc(id).set(fullPermit);
      } catch (e) {
        // Fallback
      }
    }
    localStoreData.permits[id] = fullPermit;
    saveLocalStore();
    return fullPermit;
  },

  async getAllPermits() {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('permits').get();
        if (!snapshot.empty) return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.permits);
  },

  // Print Batches & Job Items
  async createPrintBatch(batchData: any, items: any[]) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullBatch = { ...batchData, id: batchId };

    if (firestoreDb) {
      try {
        await firestoreDb.collection('print_batches').doc(batchId).set(fullBatch);
        for (const item of items) {
          const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await firestoreDb.collection('print_batches').doc(batchId).collection('print_job_items').doc(itemId).set({
            ...item,
            batch_id: batchId,
            id: itemId,
          });
        }
      } catch (e) {
        // Fallback
      }
    }

    localStoreData.print_batches[batchId] = fullBatch;
    for (const item of items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      localStoreData.print_job_items[itemId] = {
        ...item,
        batch_id: batchId,
        id: itemId,
      };
    }
    saveLocalStore();
    return fullBatch;
  },

  async getPrintBatchesByVendor(vendorUid: string) {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('print_batches').where('assigned_vendor_id', '==', vendorUid).get();
        if (!snapshot.empty) return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.print_batches).filter((b: any) => b.assigned_vendor_id === vendorUid || vendorUid === 'super_admin');
  },

  async getAllPrintBatches() {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('print_batches').get();
        if (!snapshot.empty) return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.print_batches);
  },

  async updateBatchStatus(batchId: string, status: string) {
    if (firestoreDb) {
      try {
        await firestoreDb.collection('print_batches').doc(batchId).update({ batch_status: status });
      } catch (e) {
        // Fallback
      }
    }
    if (localStoreData.print_batches[batchId]) {
      localStoreData.print_batches[batchId].batch_status = status;
      saveLocalStore();
    }
  },

  async getBatchItems(batchId: string) {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('print_batches').doc(batchId).collection('print_job_items').get();
        if (!snapshot.empty) return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.print_job_items).filter((i: any) => i.batch_id === batchId);
  },

  // Enforcement Audits
  async recordAudit(audit: any) {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullAudit = { ...audit, id: auditId };

    if (firestoreDb) {
      try {
        await firestoreDb.collection('enforcement_audits').doc(auditId).set(fullAudit);
      } catch (e) {
        // Fallback
      }
    }
    localStoreData.enforcement_audits[auditId] = fullAudit;
    saveLocalStore();
    return fullAudit;
  },

  async getAudits() {
    if (firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection('enforcement_audits').orderBy('created_at', 'desc').limit(50).get();
        if (!snapshot.empty) return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        // Fallback
      }
    }
    return Object.values(localStoreData.enforcement_audits).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Users
  async getUser(uid: string) {
    if (firestoreDb) {
      try {
        const doc = await firestoreDb.collection('users').doc(uid).get();
        if (doc.exists) return doc.data();
      } catch (e) {
        // Fallback
      }
    }
    return localStoreData.users[uid] || null;
  },

  async saveUser(user: any) {
    if (firestoreDb) {
      try {
        await firestoreDb.collection('users').doc(user.uid).set(user);
      } catch (e) {
        // Fallback
      }
    }
    localStoreData.users[user.uid] = user;
    saveLocalStore();
    return user;
  }
};
