
const DB_NAME_TAX = 'TaxCalculatorDB';
const STORE_NAME_TAX = 'calculations';
const DB_VERSION_TAX = 1;
let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    const request = indexedDB.open(DB_NAME_TAX, DB_VERSION_TAX);
    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject('Error opening database');
    };
    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME_TAX)) {
        dbInstance.createObjectStore(STORE_NAME_TAX, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const saveCalculation = async (calculation: any) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME_TAX, 'readwrite');
    const store = transaction.objectStore(STORE_NAME_TAX);
    const request = store.add(calculation);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Could not save calculation');
  });
};

export const getCalculations = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME_TAX, 'readonly');
    const store = transaction.objectStore(STORE_NAME_TAX);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    request.onerror = () => reject('Could not fetch calculations');
  });
};

export const deleteCalculation = async (id: number) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME_TAX, 'readwrite');
    const store = transaction.objectStore(STORE_NAME_TAX);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Could not delete calculation');
  });
};
