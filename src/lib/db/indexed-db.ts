import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface LearnAIDB extends DBSchema {
  queries: {
    key: string;
    value: {
      id: string;
      queryText: string;
      content: any;
      createdAt: number;
      synced: boolean;
    };
    indexes: { 'by-synced': string };
  };
  content: {
    key: string;
    value: {
      id: string;
      queryId: string;
      contentType: string;
      data: any;
      createdAt: number;
    };
    indexes: { 'by-query': string };
  };
}

let db: IDBPDatabase<LearnAIDB> | null = null;

export async function initDB() {
  if (db) return db;

  db = await openDB<LearnAIDB>('learnai-offline', 1, {
    upgrade(db) {
      // Queries store
      const queryStore = db.createObjectStore('queries', { keyPath: 'id' });
      queryStore.createIndex('by-synced', 'synced');

      // Content store
      const contentStore = db.createObjectStore('content', { keyPath: 'id' });
      contentStore.createIndex('by-query', 'queryId');
    },
  });

  return db;
}

// Save query for offline access
export async function saveQueryOffline(query: any, content: any) {
  const database = await initDB();
  
  await database.put('queries', {
    id: query.id,
    queryText: query.queryText,
    content,
    createdAt: Date.now(),
    synced: true,
  });

  console.log('💾 Saved query for offline access:', query.id);
}

// Get offline queries
export async function getOfflineQueries() {
  const database = await initDB();
  return await database.getAll('queries');
}

// Save content offline
export async function saveContentOffline(
  queryId: string,
  contentType: string,
  data: any
) {
  const database = await initDB();
  
  await database.put('content', {
    id: `${queryId}-${contentType}`,
    queryId,
    contentType,
    data,
    createdAt: Date.now(),
  });
}

// Get offline content for query
export async function getOfflineContent(queryId: string) {
  const database = await initDB();
  const index = database.transaction('content').store.index('by-query');
  return await index.getAll(queryId);
}