// ============================================================
// FILE: src/app/(auth)/login/page.tsx
// Redirects all /login traffic → /phone-login, preserving
// all query params (callbackUrl, verified, error, etc.)
//
// Email login code preserved in _email-login-backup.tsx
// ============================================================

import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') {
      query.set(key, value);
    }
  });

  const qs = query.toString();
  redirect(qs ? `/phone-login?${qs}` : '/phone-login');
}
