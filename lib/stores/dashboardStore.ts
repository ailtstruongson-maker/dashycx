import { writable } from 'svelte/store';
import type { AppState, FilterState, ProcessedData, ProductConfig } from '../types';

export const currentView = writable('dashboard');
export const appState = writable<AppState>('upload');
export const isProcessing = writable(false);
export const processedData = writable<ProcessedData | null>(null);
export const fileInfo = writable({ filename: '', savedAt: '' });

// Added missing stores for product configuration and department mapping to resolve compilation errors
export const productConfig = writable<ProductConfig>({});
export const departmentMap = writable<Record<string, string>>({});

// Store cho thời gian xử lý (ms)
export const processingTime = writable(0);
let timerInterval: any;

function startTimer() {
  processingTime.set(0);
  const start = Date.now();
  timerInterval = setInterval(() => {
    processingTime.set(Date.now() - start);
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

let worker: Worker | null = null;

export function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../services/worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'SUCCESS' || type === 'FILTER_SUCCESS' || type === 'ERROR') {
        processedData.set(payload);
        isProcessing.set(false);
        stopTimer();
        if (type === 'ERROR') {
          alert("Lỗi: " + e.data.message);
          appState.set('upload');
        }
      }
    };
  }
  return worker;
}

export const filterState = writable<FilterState>({
    kho: 'all', xuat: 'all', trangThai: [], nguoiTao: [], department: [],
    startDate: '', endDate: '', dateRange: 'all',
    industryGrid: { selectedGroups: [], selectedSubgroups: [] },
    summaryTable: {
        parent: [], child: [], manufacturer: [], creator: [], product: [],
        drilldownOrder: ['parent', 'child'], sort: { column: 'totalRevenue', direction: 'desc' }
      }
});

// Gửi lệnh xử lý file và khởi động timer
export function triggerFileUpload(file: File) {
  const w = getWorker();
  isProcessing.set(true);
  appState.set('loading');
  startTimer();
  w.postMessage({ type: 'IMPORT_FILE', payload: { file } });
}

let filterTimeout: any;
filterState.subscribe(fs => {
  if (worker) {
    isProcessing.set(true);
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      worker?.postMessage({ type: 'APPLY_FILTER', payload: fs });
    }, 150);
  }
});