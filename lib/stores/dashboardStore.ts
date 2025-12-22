

import { writable, derived } from 'svelte/store';
import type { AppState, DataRow, FilterState, ProcessedData, ProductConfig } from '../types';

/**
 * Trạng thái điều hướng của ứng dụng
 * upload: Màn hình chào mừng & tải file
 * loading: Đang đọc file từ ổ đĩa
 * processing: Đang tính toán dữ liệu
 * dashboard: Hiển thị kết quả
 */
export const appState = writable<AppState>('upload');

/**
 * Dữ liệu thô đã qua xử lý chuẩn hóa từ Worker
 */
export const originalData = writable<DataRow[]>([]);

/**
 * Cấu hình ngành hàng và hệ số quy đổi
 */
export const productConfig = writable<ProductConfig | null>(null);

/**
 * Bản đồ ánh xạ Mã nhân viên -> Bộ phận (từ file Phân ca)
 */
export const departmentMap = writable<Record<string, string>>({});

/**
 * Thông tin tệp tin đang hiển thị
 */
export const fileInfo = writable<{ filename: string; savedAt: string } | null>(null);

/**
 * Trạng thái đang xử lý (Hiển thị loading overlay)
 */
export const isProcessing = writable(false);

/**
 * Thông báo tiến độ xử lý dữ liệu
 */
export const statusMessage = writable({ 
  message: '', 
  type: 'info' as 'info' | 'success' | 'error', 
  progress: 0 
});

/**
 * Trạng thái bộ lọc hiện tại
 */
const initialFilterState: FilterState = {
    kho: 'all',
    xuat: 'all',
    trangThai: [],
    nguoiTao: [],
    department: [],
    startDate: '',
    endDate: '',
    dateRange: 'all',
    industryGrid: {
        selectedGroups: [],
        selectedSubgroups: [],
    },
    summaryTable: {
        parent: [],
        child: [],
        manufacturer: [],
        creator: [],
        product: [],
        drilldownOrder: ['parent', 'child', 'manufacturer', 'creator', 'product'],
        sort: { column: 'totalRevenue', direction: 'desc' }
    }
};

// Khởi tạo filter từ localStorage nếu có
const savedGridFilters = typeof localStorage !== 'undefined' ? localStorage.getItem('industryGridFilters') : null;
const industryGrid = savedGridFilters ? JSON.parse(savedGridFilters) : initialFilterState.industryGrid;

export const filterState = writable<FilterState>({
    ...initialFilterState,
    industryGrid
});

/**
 * Store tự động tính toán các giá trị duy nhất cho Dropdown bộ lọc
 */
export const uniqueFilters = derived([originalData, departmentMap], ([$data, $deptMap]) => {
    if (!$data || $data.length === 0) {
        return { kho: [], trangThai: [], nguoiTao: [], department: [] };
    }

    const khoSet = new Set<string>();
    const statusSet = new Set<string>();
    const creatorSet = new Set<string>();
    
    $data.forEach(row => {
        if (row['Mã kho tạo']) khoSet.add(String(row['Mã kho tạo']));
        if (row['Trạng thái hồ sơ']) statusSet.add(String(row['Trạng thái hồ sơ']));
        if (row['Người tạo']) creatorSet.add(String(row['Người tạo']));
    });

    const deptOptions = Array.from(new Set(Object.values($deptMap)))
        // FIX: Cast d to string or use String() to avoid toLowerCase() property missing on unknown error
        .filter(d => d && !['quản lý', 'trưởng ca', 'kế toán'].some(k => String(d).toLowerCase().includes(k)))
        .sort();

    return {
        kho: Array.from(khoSet).sort(),
        trangThai: Array.from(statusSet).sort(),
        nguoiTao: Array.from(creatorSet).sort(),
        department: deptOptions as string[]
    };
});

/**
 * Dữ liệu đã qua tính toán (KPIs, Trends, Employees)
 * Store này sẽ được cập nhật bởi các Service ở các bước sau
 */
export const processedData = writable<ProcessedData | null>(null);
