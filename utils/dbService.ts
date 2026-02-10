import { DiveLog, DivePhoto } from '../types';

const DB_NAME = 'DiveColorProDB';
const DB_VERSION = 1;
const LOGS_STORE_NAME = 'diveLogs';
const GALLERY_STORE_NAME = 'galleryPhotos';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(LOGS_STORE_NAME)) {
        db.createObjectStore(LOGS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(GALLERY_STORE_NAME)) {
        db.createObjectStore(GALLERY_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getStore = async (storeName: string, mode: IDBTransactionMode) => {
    const db = await openDB();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

export const getDiveLogs = async (): Promise<DiveLog[]> => {
    const store = await getStore(LOGS_STORE_NAME, 'readonly');
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveDiveLog = async (log: DiveLog): Promise<void> => {
    const store = await getStore(LOGS_STORE_NAME, 'readwrite');
    return new Promise<void>((resolve, reject) => {
        const request = store.put(log);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getGalleryPhotos = async (): Promise<DivePhoto[]> => {
    const store = await getStore(GALLERY_STORE_NAME, 'readonly');
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addGalleryPhotos = async (photos: DivePhoto[]): Promise<void> => {
    const store = await getStore(GALLERY_STORE_NAME, 'readwrite');
    const transaction = store.transaction;
    
    return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        photos.forEach(photo => {
            store.put(photo);
        });
    });
};

export const getAllPhotos = async (): Promise<DivePhoto[]> => {
    const photosFromLogs = (await getDiveLogs()).flatMap(log => log.photos);
    const galleryPhotos = await getGalleryPhotos();
    
    const combinedPhotos = [...photosFromLogs, ...galleryPhotos];
    
    // Deduplicate photos based on ID
    const uniquePhotos = Array.from(new Map(combinedPhotos.map(p => [p.id, p])).values());

    return uniquePhotos.sort((a,b) => parseInt(b.id.split('-')[0]) - parseInt(a.id.split('-')[0]));
};


// Simple, one-time data migration from localStorage to IndexedDB
export const migrateFromLocalStorage = async () => {
  const migrationKey = 'indexedDB_migration_v1_complete';
  if (localStorage.getItem(migrationKey)) {
    return;
  }

  console.log('Starting data migration from localStorage to IndexedDB...');
  
  try {
    // Migrate dive logs
    const logsData = localStorage.getItem('diveLogs');
    if (logsData) {
      const logs: DiveLog[] = JSON.parse(logsData);
      if (Array.isArray(logs)) {
        for (const log of logs) {
          await saveDiveLog(log);
        }
        console.log(`Migrated ${logs.length} dive logs.`);
      }
    }
  
    // Migrate gallery photos
    const photosData = localStorage.getItem('galleryPhotos');
    if (photosData) {
      const photos: DivePhoto[] = JSON.parse(photosData);
      if (Array.isArray(photos)) {
        await addGalleryPhotos(photos);
        console.log(`Migrated ${photos.length} gallery photos.`);
      }
    }
    
    localStorage.setItem(migrationKey, 'true');
    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration failed:', error);
    // Don't set the migration key if it fails, so it can be retried.
  }
};