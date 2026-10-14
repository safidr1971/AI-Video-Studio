import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let isFirebaseReady = false;

// Attempt to load firebase config if present using Vite glob pattern so bundler doesn't fail when file is absent
try {
  const configModules = import.meta.glob<{ default: any }>('/firebase-applet-config.json', { eager: true });
  const configModule = configModules['/firebase-applet-config.json'];
  const config = configModule?.default || configModule;
  if (config && config.apiKey && config.projectId) {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app, config.firestoreDatabaseId);
    isFirebaseReady = true;

    // Validate connection
    if (db) {
      getDocFromServer(doc(db, 'test', 'connection')).catch((err) => {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          console.warn('Firebase client is offline or project pending setup.');
        }
      });
    }
  }
} catch (e) {
  // Not configured yet
}

export function isDevTokenAllowed(): boolean {
  // Never allow in production
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    return false;
  }
  const flag = String(import.meta.env.VITE_ALLOW_DEV_TOKEN || '').trim().toLowerCase();
  return flag === 'true' || flag === '1';
}

export async function getIdToken(): Promise<string> {
  // 1. If real Firebase Auth user is signed in, return their genuine verified ID token
  if (auth?.currentUser) {
    return await auth.currentUser.getIdToken();
  }

  // 2. In production, never return or store mock/dev tokens
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    localStorage.removeItem('ai_studio_auth_token');
    throw new Error('Authentication required: Please sign in with your Firebase account.');
  }

  // 3. In non-production, check if developer token bypass is explicitly enabled
  const isAllowed = isDevTokenAllowed();
  const storedToken = localStorage.getItem('ai_studio_auth_token');

  if (storedToken) {
    const isDev = storedToken.startsWith('dev-token-') || storedToken.startsWith('test-token-');
    if (isDev && !isAllowed) {
      localStorage.removeItem('ai_studio_auth_token');
    } else if (!isDev || isAllowed) {
      return storedToken;
    }
  }

  if (isAllowed) {
    const defaultDevToken = 'dev-token-creator-default';
    localStorage.setItem('ai_studio_auth_token', defaultDevToken);
    return defaultDevToken;
  }

  throw new Error(
    'Authentication required: Please sign in with Google or enable VITE_ALLOW_DEV_TOKEN=true for local development.'
  );
}

export function setCustomDevToken(token: string) {
  if (import.meta.env.PROD || import.meta.env.MODE === 'production' || !isDevTokenAllowed()) {
    console.warn('Custom dev tokens are disallowed when dev token mode is disabled or in production.');
    return;
  }
  localStorage.setItem('ai_studio_auth_token', token);
}

export function getStoredDevToken(): string {
  if (!isDevTokenAllowed()) {
    return '';
  }
  return localStorage.getItem('ai_studio_auth_token') || '';
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function loginWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase Authentication is not yet configured. Please follow the setup steps in Settings.');
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
  localStorage.removeItem('ai_studio_auth_token');
}
