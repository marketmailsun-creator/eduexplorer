import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

// Lazy singleton — only initializes when env vars are present
let adminAuthInstance: ReturnType<typeof getAuth> | null = null;
let adminMessagingInstance: ReturnType<typeof getMessaging> | null = null;

function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) return null;

  try {
    return !getApps().length
      ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
      : getApps()[0];
  } catch {
    return null;
  }
}

export function getAdminAuth(): ReturnType<typeof getAuth> | null {
  if (adminAuthInstance) return adminAuthInstance;
  const app = getAdminApp();
  if (!app) return null;
  adminAuthInstance = getAuth(app);
  return adminAuthInstance;
}

export function getAdminMessaging(): ReturnType<typeof getMessaging> | null {
  if (adminMessagingInstance) return adminMessagingInstance;
  const app = getAdminApp();
  if (!app) return null;
  adminMessagingInstance = getMessaging(app);
  return adminMessagingInstance;
}
