'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PhoneUpdateModal } from './PhoneUpdateModal';

export function PhonePromptClient() {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Only show once per session
    if (sessionStorage.getItem('phone_prompt_dismissed')) return;

    // Check if user already has a phone
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.phone) {
          setShowModal(true);
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const handleClose = () => {
    setShowModal(false);
    sessionStorage.setItem('phone_prompt_dismissed', '1');
  };

  return <PhoneUpdateModal isOpen={showModal} onClose={handleClose} />;
}
