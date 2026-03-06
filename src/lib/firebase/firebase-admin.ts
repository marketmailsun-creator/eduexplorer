import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Lazy singleton — only initializes when env vars are present
let adminAuthInstance: ReturnType<typeof getAuth> | null = null;

export function getAdminAuth(): ReturnType<typeof getAuth> | null {
  if (adminAuthInstance) return adminAuthInstance;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // Firebase Admin not configured — firebase-phone provider will fail gracefully
    return null;
  }

  try {
    const adminApp = !getApps().length
      ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
      : getApps()[0];

    adminAuthInstance = getAuth(adminApp);
    return adminAuthInstance;
  } catch {
    return null;
  }
}
