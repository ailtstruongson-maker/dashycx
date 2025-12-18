
import type { DepartmentMap } from './dataService';
import type { DataRow, ProductConfig, WarehouseColumnConfig, StoredSalesData, StoredProductConfig, Employee, AnalysisRecord, ColumnConfig, CustomContestTab, ContestTableConfig, HeadToHeadTableConfig } from '../types';


const DB_NAME = 'DashboardDB';
const DB_VERSION = 1;
const STORE_NAME = 'appStorage';

// Key constants
const DEPT_MAP_KEY = 'departmentMap';
const SALES_DATA_KEY = 'salesData';
const PRODUCT_CONFIG_KEY = 'productConfig';
const WAREHOUSE_COLUMN_CONFIG_KEY = 'warehouseColumnConfig';
const ANALYSIS_HISTORY_KEY = 'analysisHistory';
const CUSTOM_TABS_KEY = 'customContestTabs';
const HEAD_TO_HEAD_CUSTOM_TABLES_KEY = 'headToHeadCustomTables';
const INDUSTRY_ANALYSIS_CUSTOM_TABLES_KEY = 'industryAnalysisCustomTables';
const THEME_MAP_INDUSTRY_KEY = 'themeMapIndustry';
const THEME_MAP_PERFORMANCE_KEY = 'themeMapPerformance';
const INDUSTRY_VISIBLE_GROUPS_KEY = 'industryVisibleGroups';
const DEDUPLICATION_SETTING_KEY = 'deduplicationSetting';
const KPI_TARGETS_KEY = 'kpiTargets';


// Một promise duy nhất cho cơ sở dữ liệu để tránh các điều kiện tranh chấp (race conditions).
let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('Trình duyệt của bạn không hỗ trợ IndexedDB.'));
                return;
            }
            
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Lỗi IndexedDB:', request.error);
                reject(new Error('Lỗi khi mở IndexedDB. Vui lòng kiểm tra cài đặt trình duyệt của bạn.'));
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            // Sự kiện này chỉ được kích hoạt khi phiên bản thay đổi hoặc khi cơ sở dữ liệu được tạo lần đầu.
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }
    return dbPromise;
}

// --- Department Map ---

export async function saveDepartmentMap(map: DepartmentMap): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(map, DEPT_MAP_KEY);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu dữ liệu phân ca.'));
    });
}

export async function getDepartmentMap(): Promise<DepartmentMap | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(DEPT_MAP_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Không thể tải dữ liệu phân ca.'));
    });
}

export async function clearDepartmentMap(): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(DEPT_MAP_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể xóa dữ liệu phân ca.'));
    });
}

// --- Sales Data ---

export async function saveSalesData(data: DataRow[], filename: string): Promise<void> {
    const db = await getDb();
    const storedObject: StoredSalesData = { data, filename, savedAt: new Date() };
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(storedObject, SALES_DATA_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu dữ liệu bán hàng.'));
    });
}

export async function getSalesData(): Promise<StoredSalesData | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(SALES_DATA_KEY);
        request.onsuccess = () => {
            if (request.result && request.result.savedAt) {
                request.result.savedAt = new Date(request.result.savedAt);
            }
            resolve(request.result || null);
        };
        request.onerror = () => reject(new Error('Không thể tải dữ liệu bán hàng đã lưu.'));
    });
}

export async function clearSalesData(): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(SALES_DATA_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể xóa dữ liệu bán hàng.'));
    });
}

// --- Product Config ---

export async function saveProductConfig(config: ProductConfig, url: string): Promise<void> {
    const db = await getDb();
    const storedObject: StoredProductConfig = { config, url, fetchedAt: new Date() };
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(storedObject, PRODUCT_CONFIG_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu file cấu hình.'));
    });
}

export async function getProductConfig(): Promise<StoredProductConfig | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(PRODUCT_CONFIG_KEY);
        request.onsuccess = () => {
            if (request.result && request.result.fetchedAt) {
                request.result.fetchedAt = new Date(request.result.fetchedAt);
            }
            resolve(request.result || null);
        };
        request.onerror = () => reject(new Error('Không thể tải file cấu hình đã lưu.'));
    });
}

export async function clearProductConfig(): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(PRODUCT_CONFIG_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể xóa file cấu hình.'));
    });
}

// --- Warehouse Column Config ---

export async function saveWarehouseColumnConfig(config: WarehouseColumnConfig[]): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(config, WAREHOUSE_COLUMN_CONFIG_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu cấu hình cột kho.'));
    });
}

export async function getWarehouseColumnConfig(): Promise<WarehouseColumnConfig[] | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(WAREHOUSE_COLUMN_CONFIG_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Không thể tải cấu hình cột kho.'));
    });
}

// --- Deduplication Setting ---

export async function saveDeduplicationSetting(isEnabled: boolean): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(isEnabled, DEDUPLICATION_SETTING_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu cài đặt xóa trùng.'));
    });
}

export async function getDeduplicationSetting(): Promise<boolean> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(DEDUPLICATION_SETTING_KEY);
        request.onsuccess = () => resolve(request.result === true); // Default to false if undefined
        request.onerror = () => reject(new Error('Không thể tải cài đặt xóa trùng.'));
    });
}

// --- KPI Targets ---

export interface KpiTargets {
    hieuQua: number;
    traGop: number;
}

export async function saveKpiTargets(targets: KpiTargets): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(targets, KPI_TARGETS_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu mục tiêu KPI.'));
    });
}

export async function getKpiTargets(): Promise<KpiTargets | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(KPI_TARGETS_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Không thể tải mục tiêu KPI.'));
    });
}

// --- AI Analysis History ---
export async function saveTopSellerAnalysis(analysis: string, dataUsed: Employee[]): Promise<void> {
    const db = await getDb();
    const history = await getTopSellerAnalysisHistory(); // Get existing history
    
    const newRecord: AnalysisRecord = {
        timestamp: Date.now(),
        type: 'topSeller',
        analysis,
        dataUsed
    };
    
    // Keep the last 30 records
    const updatedHistory = [newRecord, ...history].slice(0, 30);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(updatedHistory, ANALYSIS_HISTORY_KEY);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu lịch sử phân tích.'));
    });
}

export async function getTopSellerAnalysisHistory(): Promise<AnalysisRecord[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(ANALYSIS_HISTORY_KEY);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(new Error('Không thể tải lịch sử phân tích.'));
    });
}

// --- Custom Contest Tabs ---
export async function saveCustomTabs(tabs: CustomContestTab[]): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(tabs, CUSTOM_TABS_KEY);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu các tab tùy chỉnh.'));
    });
}

export async function getCustomTabs(): Promise<CustomContestTab[] | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(CUSTOM_TABS_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Không thể tải các tab tùy chỉnh đã lưu.'));
    });
}

export async function clearCustomTabs(): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(CUSTOM_TABS_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể xóa các tab tùy chỉnh.'));
    });
}

// --- Head to Head Custom Tables ---
export async function saveHeadToHeadCustomTables(tables: HeadToHeadTableConfig[]): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(tables, HEAD_TO_HEAD_CUSTOM_TABLES_KEY);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu bảng tùy chỉnh của tab 7 Ngày.'));
    });
}

export async function getHeadToHeadCustomTables(): Promise<HeadToHeadTableConfig[] | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(HEAD_TO_HEAD_CUSTOM_TABLES_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Không thể tải bảng tùy chỉnh của tab 7 Ngày.'));
    });
}

// --- Industry Analysis Custom Tables ---
export async function saveIndustryAnalysisCustomTables(tables: ContestTableConfig[]): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(tables, INDUSTRY_ANALYSIS_CUSTOM_TABLES_KEY);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu bảng tùy chỉnh của tab Khai Thác.'));
    });
}

export async function getIndustryAnalysisCustomTables(): Promise<ContestTableConfig[] | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(INDUSTRY_ANALYSIS_CUSTOM_TABLES_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Không thể tải bảng tùy chỉnh của tab Khai Thác.'));
    });
}

// --- Theme Maps ---
export type ThemeMap = { [key: string]: number };

export async function saveThemeMap(key: 'industry' | 'performance', map: ThemeMap): Promise<void> {
    const db = await getDb();
    const dbKey = key === 'industry' ? THEME_MAP_INDUSTRY_KEY : THEME_MAP_PERFORMANCE_KEY;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(map, dbKey);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error(`Không thể lưu theme map for ${key}.`));
    });
}

export async function getThemeMap(key: 'industry' | 'performance'): Promise<ThemeMap | null> {
    const db = await getDb();
    const dbKey = key === 'industry' ? THEME_MAP_INDUSTRY_KEY : THEME_MAP_PERFORMANCE_KEY;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(dbKey);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error(`Không thể tải theme map for ${key}.`));
    });
}

// --- Industry Visible Groups ---
export async function saveIndustryVisibleGroups(groups: string[]): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(groups, INDUSTRY_VISIBLE_GROUPS_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Không thể lưu các nhóm hiển thị của tab Khai Thác.'));
    });
}

export async function getIndustryVisibleGroups(): Promise<string[] | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(INDUSTRY_VISIBLE_GROUPS_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Không thể tải các nhóm hiển thị của tab Khai Thác.'));
    });
}
