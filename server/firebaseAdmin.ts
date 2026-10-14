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

export function hasRealFirestoreCredentials(): boolean {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return true;
  }
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.projectId && parsed.projectId !== 'remixed-project-id') {
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

export function isFirebaseAdminConfigured(): boolean {
  return hasRealFirestoreCredentials();
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

export function isDevTokenAllowed(): boolean {
  // Never allow in production environment under any circumstance
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  // Allow only when explicitly enabled via env var or in unit tests
  return process.env.ALLOW_DEV_TOKEN === 'true' || process.env.NODE_ENV === 'test';
}

export function assertProductionConfigSafe(): void {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_TOKEN === 'true') {
    throw new Error('FATAL SECURITY CONFIGURATION: ALLOW_DEV_TOKEN=true is strictly prohibited in production mode.');
  }
}

export async function verifyToken(token: string): Promise<VerifiedUser> {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is missing or not a string');
  }

  const isDevOrTestToken = token.startsWith('test-token-') || token.startsWith('dev-token-');

  if (isDevOrTestToken) {
    // 1. Strictly forbid fake tokens in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Development tokens are strictly forbidden in production.');
    }

    // 2. Default to disabled in development unless explicitly configured
    if (!isDevTokenAllowed()) {
      throw new Error(
        'Development tokens are disabled. Set ALLOW_DEV_TOKEN=true in a non-production environment to enable local developer bypass.'
      );
    }

    const uid = token.replace(/^(test-token-|dev-token-)/, '') || 'dev-user';
    return {
      uid,
      email: `${uid}@studio-local.internal`,
      emailVerified: true,
      role: 'creator',
    };
  }

  // Real Firebase ID tokens are always verified via Firebase Admin Auth
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email,
    emailVerified: decoded.email_verified,
    role: (decoded as any).role || 'creator',
  };
}
