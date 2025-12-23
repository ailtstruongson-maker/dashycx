
import type { 
  DataRow, 
  ProductConfig, 
  StoredSalesData, 
  StoredProductConfig, 
  CustomContestTab,
  FilterState
} from '../types';

const DB_NAME = 'BI_HUB_DATABASE_V2';
const DB_VERSION = 2;
const APP_STORE = 'appStorage';
const SETTINGS_STORE = 'settings';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(APP_STORE)) db.createObjectStore(APP_STORE);
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) db.createObjectStore(SETTINGS_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

/**
 * Thao tác với Settings (Thay thế localStorage)
 */
export async function saveSetting(key: string, value: any): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = tx.objectStore(SETTINGS_STORE);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Các hàm cũ cho dữ liệu lớn
export async function saveSalesData(data: DataRow[], filename: string): Promise<void> {
  const stored: StoredSalesData = { data, filename, savedAt: new Date() };
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(APP_STORE, 'readwrite');
    tx.objectStore(APP_STORE).put(stored, 'salesData');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSalesData(): Promise<StoredSalesData | null> {
  const db = await getDb();
  return new Promise((resolve) => {
    const tx = db.transaction(APP_STORE, 'readonly');
    const request = tx.objectStore(APP_STORE).get('salesData');
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function clearSalesData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(APP_STORE, 'readwrite');
  tx.objectStore(APP_STORE).delete('salesData');
}
