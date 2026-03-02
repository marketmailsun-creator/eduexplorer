'use client';

import { useEffect } from 'react';
import { initCapacitorPush } from '@/lib/capacitor/push-init';

export function CapacitorInit() {
  useEffect(() => {
    initCapacitorPush();
  }, []);

  return null;
}
