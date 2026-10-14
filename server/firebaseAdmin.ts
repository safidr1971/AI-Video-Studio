import { initializeApp, getApps, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let appInstance: App | null = null;
let isInitialized = false;
let initError: string | null = null;

function initializeAdmin() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    appInstance = existingApps[0];
    isInitialized = true;
    return;
  }

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    let projectId: string | undefined = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.projectId && parsed.projectId !== 'remixed-project-id') {
          projectId = parsed.projectId;
        }
      } catch (err) {
        // ignore parse error
      }
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      appInstance = initializeApp({
        credential: applicationDefault(),
        projectId,
      });
      isInitialized = true;
    } else if (projectId) {
      appInstance = initializeApp({
        projectId,
      });
      isInitialized = true;
    } else {
      // In local dev without credentials, initialize with default project or mark unconfigured
      appInstance = initializeApp({
        projectId: 'ai-video-studio-dev',
      });
      isInitialized = true;
    }
  } catch (err: any) {
    initError = err.message || 'Failed to initialize Firebase Admin';
    console.warn('Firebase Admin SDK warning:', initError);
    isInitialized = false;
  }
}

initializeAdmin();

export function isFirebaseAdminConfigured(): boolean {
  return isInitialized;
}

export function getAdminAuth(): Auth {
  if (!isInitialized) {
    throw new Error('Firebase Admin SDK is not initialized. Please verify Firebase credentials.');
  }
  return getAuth();
}

export function getAdminFirestore(): Firestore {
  if (!isInitialized) {
    throw new Error('Firebase Admin Firestore is not initialized. Please verify Firebase credentials.');
  }
  return getFirestore();
}

export interface VerifiedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  role?: string;
}

export async function verifyToken(token: string): Promise<VerifiedUser> {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is missing or not a string');
  }

  // Deterministic test token bypass strictly in test environment
  if (process.env.NODE_ENV === 'test' && token.startsWith('test-token-')) {
    const uid = token.replace('test-token-', '');
    return {
      uid,
      email: `${uid}@studio-test.internal`,
      emailVerified: true,
      role: 'creator',
    };
  }

  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email,
    emailVerified: decoded.email_verified,
    role: (decoded as any).role || 'creator',
  };
}
