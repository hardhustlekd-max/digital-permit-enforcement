import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const keyId = process.env.B2_APPLICATION_KEY_ID || '';
const applicationKey = process.env.B2_APPLICATION_KEY || '';
const endpoint = process.env.B2_ENDPOINT || 's3.us-west-004.backblazeb2.com';
const bucketName = process.env.B2_BUCKET_NAME || 'motorcycle-permits-bucket';

const hasB2Config = keyId.length > 0 && applicationKey.length > 0;

let s3Client: S3Client | null = null;

if (hasB2Config) {
  const formattedEndpoint = endpoint.startsWith('http') ? endpoint : `https://${endpoint}`;
  s3Client = new S3Client({
    endpoint: formattedEndpoint,
    region: 'us-west-004', // standard B2 default or derived
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: applicationKey,
    },
    forcePathStyle: true,
  });
  console.log('[Backblaze B2] Initialized S3 Client with endpoint:', formattedEndpoint);
} else {
  console.log('[Backblaze B2] Credentials missing in .env. Using high-availability local storage fallback.');
}

// In-memory / local disk cache for fallback storage when B2 keys are not supplied
const localStorageDir = path.join(process.cwd(), 'uploads_fallback');
if (!fs.existsSync(localStorageDir)) {
  fs.mkdirSync(localStorageDir, { recursive: true });
}

export const localFileMap = new Map<string, { buffer: Buffer; mimeType: string }>();

/**
 * Uploads a file buffer directly to Backblaze B2 bucket or returns a accessible URL.
 */
export async function uploadToB2(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const cleanFileName = fileName.startsWith('/') ? fileName.slice(1) : fileName;

  if (s3Client && hasB2Config) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: cleanFileName,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);

      const formattedEndpoint = endpoint.replace(/^https?:\/\//, '');
      const publicUrl = `https://${bucketName}.${formattedEndpoint}/${cleanFileName}`;
      console.log(`[Backblaze B2] Uploaded successfully: ${publicUrl}`);
      return publicUrl;
    } catch (err) {
      console.error('[Backblaze B2] Upload error, falling back to app storage:', err);
    }
  }

  // Fallback storage when B2 environment credentials are empty or during local dev
  const safeBaseName = path.basename(cleanFileName);
  localFileMap.set(safeBaseName, { buffer: fileBuffer, mimeType });
  
  try {
    const diskPath = path.join(localStorageDir, safeBaseName);
    fs.writeFileSync(diskPath, fileBuffer);
  } catch (e) {
    // Ignore if ephemeral fs
  }

  const appUrl = process.env.APP_URL || '';
  const baseUrl = appUrl ? appUrl.replace(/\/$/, '') : 'http://localhost:3000';
  return `${baseUrl}/api/storage/file/${safeBaseName}`;
}
