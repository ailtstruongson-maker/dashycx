
import type { 
  DataRow, 
  ProductConfig, 
  StoredSalesData, 
  StoredProductConfig, 
  AnalysisRecord, 
  CustomContestTab, 
  HeadToHeadTableConfig,
  ContestTableConfig
} from '../types';

const DB_NAME = 'DashboardDB_Svelte';
const DB_VERSION = 1;
const STORE_NAME = 'appStorage';

// Khóa định danh cho các loại dữ liệu
const KEYS = {
  DEPT_MAP: 'departmentMap',
  SALES_DATA: 'salesData',
  PRODUCT_CONFIG: 'productConfig',
  DEDUPE_SETTING: 'deduplicationSetting',
  KPI_TARGETS: 'kpiTargets',
  ANALYSIS_HISTORY: 'analysisHistory',
  CUSTOM_TABS: 'customContestTabs',
  H2H_TABLES: 'headToHeadCustomTables',
  INDUSTRY_TABLES: 'industryAnalysisCustomTables'
};

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Khởi tạo và kết nối cơ sở dữ liệu IndexedDB
 */
function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Trình duyệt không hỗ trợ IndexedDB.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Hàm tiện ích để thực thi transaction
 */
async function performOp<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = op(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- API Dữ liệu Bán hàng ---
export async function saveSalesData(data: DataRow[], filename: string): Promise<void> {
  const storedObject: StoredSalesData = { data, filename, savedAt: new Date() };
  await performOp('readwrite', (store) => store.put(storedObject, KEYS.SALES_DATA));
}

export async function getSalesData(): Promise<StoredSalesData | null> {
  return performOp<StoredSalesData>('readonly', (store) => store.get(KEYS.SALES_DATA));
}

export async function clearSalesData(): Promise<void> {
  await performOp('readwrite', (store) => store.delete(KEYS.SALES_DATA));
}

// --- API Phân ca & Bộ phận ---
export async function saveDepartmentMap(map: Record<string, string>): Promise<void> {
  await performOp('readwrite', (store) => store.put(map, KEYS.DEPT_MAP));
}

export async function getDepartmentMap(): Promise<Record<string, string> | null> {
  return performOp<Record<string, string>>('readonly', (store) => store.get(KEYS.DEPT_MAP));
}

// --- API Cấu hình Sản phẩm ---
export async function saveProductConfig(config: ProductConfig, url: string): Promise<void> {
  const stored: StoredProductConfig = { config, url, fetchedAt: new Date() };
  await performOp('readwrite', (store) => store.put(stored, KEYS.PRODUCT_CONFIG));
}

export async function getProductConfig(): Promise<StoredProductConfig | null> {
  return performOp<StoredProductConfig>('readonly', (store) => store.get(KEYS.PRODUCT_CONFIG));
}

// --- API Bảng Thi Đua Tùy Chỉnh ---
export async function saveCustomTabs(tabs: CustomContestTab[]): Promise<void> {
  await performOp('readwrite', (store) => store.put(tabs, KEYS.CUSTOM_TABS));
}

export async function getCustomTabs(): Promise<CustomContestTab[] | null> {
  return performOp<CustomContestTab[]>('readonly', (store) => store.get(KEYS.CUSTOM_TABS));
}

// --- Cài đặt khác ---
export async function saveKpiTargets(targets: { hieuQua: number; traGop: number }): Promise<void> {
  await performOp('readwrite', (store) => store.put(targets, KEYS.KPI_TARGETS));
}

export async function getKpiTargets(): Promise<{ hieuQua: number; traGop: number } | null> {
  return performOp<{ hieuQua: number; traGop: number }>('readonly', (store) => store.get(KEYS.KPI_TARGETS));
}
