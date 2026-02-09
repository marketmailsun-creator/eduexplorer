'use client';

import { useEffect, useState } from 'react';
import { saveQueryOffline, getOfflineQueries } from '@/lib/db/indexed-db';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      
      if (navigator.onLine) {
        syncPendingData();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check on mount
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const syncPendingData = async () => {
    const queries = await getOfflineQueries();
    const unsynced = queries.filter(q => !q.synced);
    
    setPendingSync(unsynced.length);

    // Sync unsynced queries
    for (const query of unsynced) {
      try {
        await fetch('/api/sync/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(query),
        });
        
        // Mark as synced
        query.synced = true;
        // Update in IndexedDB
      } catch (error) {
        console.error('Sync failed for query:', query.id);
      }
    }

    setPendingSync(0);
  };

  return { isOnline, pendingSync, syncPendingData };
}