
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import type { AppState, Status, ProcessedData, DataRow, FilterState, ProductConfig, ChatMessage, Employee } from '../../types';
import type { Chat } from '@google/genai';
// FIX: Removed 'processFile' as it is not exported and logic is moved to a worker.
import { loadConfigFromSheet, processShiftFile, DepartmentMap } from '../../services/dataService';
import { applyFiltersAndProcess } from '../../services/filterService';
import { exportElementAsImage } from '../../services/uiService';
import { createChatSession } from '../../services/aiService';
import { saveDepartmentMap, getDepartmentMap, clearDepartmentMap, saveSalesData, getSalesData, clearSalesData, getProductConfig, saveProductConfig, clearProductConfig, clearCustomTabs } from '../../services/dbService';
import { getRowValue } from '../../utils/dataUtils';
import { COL } from '../../constants';
import PerformanceModal from '../modals/PerformanceModal';

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
        drilldownOrder: ['manufacturer', 'creator'],
        sort: { column: 'totalRevenue', direction: 'desc' }
    }
};

export const useDashboardLogic = () => {
    const [status, setStatus] = useState<Status>({ message: '', type: 'info', progress: 0 });
    const [appState, setAppState] = useState<AppState>('loading');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isClearingDepartments, setIsClearingDepartments] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [fileInfo, setFileInfo] = useState<{ filename: string; savedAt: string } | null>(null);

    const [originalData, setOriginalData] = useState<DataRow[]>([]);
    const [baseFilteredData, setBaseFilteredData] = useState<DataRow[]>([]);
    const [productConfig, setProductConfig] = useState<ProductConfig | null>(null);
    const [departmentMap, setDepartmentMap] = useState<DepartmentMap | null>(null);
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [employeeAnalysisData, setEmployeeAnalysisData] = useState<ProcessedData['employeeData'] | null>(null);
    const [configUrl, setConfigUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vRhes_lcas8n2_xYHKylsjyD3PIVbdchCiL2XDKJ4OYfgUZlVjAT7ZGWDHrYRzQVrK2w50W86Da3l48/pub?output=csv');

    const [filterState, setFilterState] = useState<FilterState>(() => {
        const saved = localStorage.getItem('industryGridFilters');
        const industryGrid = saved ? JSON.parse(saved) : initialFilterState.industryGrid;
        if (!industryGrid.selectedSubgroups) {
            industryGrid.selectedSubgroups = [];
        }
        return { ...initialFilterState, industryGrid };
    });
    const [uniqueFilterOptions, setUniqueFilterOptions] = useState<{ kho: string[]; trangThai: string[]; nguoiTao: string[], department: string[] }>({ kho: [], trangThai: [], nguoiTao: [], department: [] });
    
    const [activeModal, setActiveModal] = useState<'performance' | 'unshipped' | null>(null);
    const [modalData, setModalData] = useState<any>(null);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isAiResponding, setIsAiResponding] = useState(false);
    const chatSession = useRef<Chat | null>(null);

    // Initial Data Loading Effect
    useEffect(() => {
        const loadInitialData = async () => {
            setAppState('loading');
            setIsProcessing(true);
            try {
                let config: ProductConfig;
                const cachedConfig = await getProductConfig();
                if (cachedConfig) {
                    config = cachedConfig.config;
                } else {
                    config = await loadConfigFromSheet(configUrl, () => {});
                    await saveProductConfig(config, configUrl);
                }
                setProductConfig(config);

                const savedDeptMap = await getDepartmentMap();
                if (savedDeptMap) setDepartmentMap(savedDeptMap);

                const savedSales = await getSalesData();
                if (savedSales && savedSales.data.length > 0) {
                    setStatus({ message: 'Đang tải dữ liệu đã lưu...', type: 'info', progress: 25 });
                    setFileInfo({ filename: savedSales.filename, savedAt: savedSales.savedAt.toLocaleString('vi-VN') });

                    const rehydratedData = savedSales.data.map(row => ({
                        ...row,
                        parsedDate: row.parsedDate ? new Date(row.parsedDate as string) : null,
                    })).filter(row => row.parsedDate && !isNaN(row.parsedDate.getTime()));
                    
                    setOriginalData(rehydratedData);
                    setAppState('dashboard');
                    setIsProcessing(true);


                    // Silently check for config updates
                    try {
                        const latestConfig = await loadConfigFromSheet(configUrl, () => {});
                        if (JSON.stringify(config) !== JSON.stringify(latestConfig)) {
                            console.log("Phát hiện cấu hình mới, đang tự động cập nhật...");
                            await saveProductConfig(latestConfig, configUrl);
                            setProductConfig(latestConfig);
                        }
                    } catch (updateError) {
                        console.warn("Không thể kiểm tra cập nhật cấu hình tự động:", updateError);
                    }
                } else {
                    setAppState('upload');
                    setIsProcessing(false);
                }
            } catch (e) {
                console.error("Lỗi khi tải dữ liệu ban đầu:", e);
                const msg = e instanceof Error ? e.message : 'Lỗi không xác định khi tải dữ liệu.';
                setStatus({ message: msg, type: 'error', progress: 0 });
                setAppState('upload');
                await Promise.all([clearSalesData(), clearDepartmentMap(), clearProductConfig()]);
                setIsProcessing(false);
            }
        };
        loadInitialData();
    }, [configUrl]);

    // Filter Options Setup Effect
    useEffect(() => {
        if (originalData.length > 0) {
            const khoOptions = [...new Set(originalData.map(r => getRowValue(r, COL.KHO)).filter(Boolean).map(String))];
            const trangThaiOptions = [...new Set(originalData.map(r => getRowValue(r, COL.TRANG_THAI)).filter(Boolean).map(String))];
            const nguoiTaoOptions = [...new Set(originalData.map(r => getRowValue(r, COL.NGUOI_TAO)).filter(Boolean).map(String))];
            
            let deptOptions: string[] = [];
            if(departmentMap) {
                const uniqueDepartments = Array.from(new Set(Object.values(departmentMap).map(String))).sort();
                const excludedKeywords = ['quản lý', 'trưởng ca', 'kế toán', 'tiếp đón khách hàng'];
                deptOptions = uniqueDepartments.filter(d => !excludedKeywords.some(keyword => d.toLowerCase().includes(keyword)));
            }

            setUniqueFilterOptions({ kho: khoOptions, trangThai: trangThaiOptions, nguoiTao: nguoiTaoOptions, department: deptOptions });
            setFilterState(prev => ({ ...prev, trangThai: trangThaiOptions, nguoiTao: nguoiTaoOptions, department: deptOptions }));
        }
    }, [originalData, departmentMap]);
    
    const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
        setFilterState(prev => {
            const updated = { ...prev, ...newFilters };
            if (newFilters.industryGrid) {
                updated.industryGrid = { ...prev.industryGrid, ...newFilters.industryGrid };
                localStorage.setItem('industryGridFilters', JSON.stringify(updated.industryGrid));
            }
            if (newFilters.summaryTable) {
                updated.summaryTable = { ...prev.summaryTable, ...newFilters.summaryTable };
            }
            return updated;
        });
    }, []);

    // Central Data Processing Effect
    useEffect(() => {
        if (appState !== 'dashboard' || !originalData.length || !productConfig) return;

        setIsProcessing(true);
        const timer = setTimeout(() => {
            try {
                const { processedData: result, baseFilteredData: newBaseData } = applyFiltersAndProcess(originalData, productConfig, filterState, departmentMap);
                setProcessedData(result);
                setBaseFilteredData(newBaseData);
                
                if (departmentMap) {
                    const employeeFilterState = { ...filterState, department: [] };
                    const { processedData: employeeResult } = applyFiltersAndProcess(originalData, productConfig, employeeFilterState, departmentMap);
                    setEmployeeAnalysisData(employeeResult.employeeData);
                } else {
                    setEmployeeAnalysisData(result.employeeData);
                }
                // Dòng thông báo thành công đã được ẩn đi để giảm sự gián đoạn
            } catch (error) {
                console.error("Lỗi khi xử lý lại dữ liệu:", error);
                setStatus({ message: "Đã xảy ra lỗi trong quá trình xử lý dữ liệu.", type: 'error', progress: 0 });
                setAppState('upload');
            } finally {
                setIsProcessing(false);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [appState, originalData, productConfig, filterState, departmentMap]);
    
    // Reset Chat Session Effect
    useEffect(() => {
        chatSession.current = null;
        setChatHistory([]);
    }, [processedData]);

    const openPerformanceModal = (employeeName: string) => {
        setModalData({ employeeName });
        setActiveModal('performance');
    };

    const handleBatchExport = async (employeesToExport: Employee[]) => {
        if (!employeesToExport.length || !productConfig || !processedData) return;
        setIsExporting(true);
        const offscreenContainer = document.createElement('div');
        offscreenContainer.style.cssText = 'position: absolute; left: -9999px; top: 0;';
        document.body.appendChild(offscreenContainer);
        const root = ReactDOM.createRoot(offscreenContainer);
        try {
            for (const employee of employeesToExport) {
                await new Promise<void>(resolve => {
                    root.render(
                        React.createElement(PerformanceModal, {
                            isOpen: true,
                            onClose: () => {},
                            employeeName: employee.name,
                            fullSellerArray: processedData.employeeData.fullSellerArray,
                            validSalesData: processedData.filteredValidSalesData,
                            productConfig: productConfig,
                            onExport: exportElementAsImage,
                            isBatchExporting: true
                        })
                    );
                    setTimeout(resolve, 1000);
                });
                const modalContent = offscreenContainer.querySelector('.modal-content');
                if (modalContent) {
                    const filename = `phan-tich-hieu-qua-${employee.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                    await exportElementAsImage(modalContent as HTMLElement, filename, { scale: 2, forceOpenDetails: true });
                }
            }
        } finally {
            setIsExporting(false);
            root.unmount();
            document.body.removeChild(offscreenContainer);
        }
    };

    const handleBatchKhoExport = async () => {
        if (uniqueFilterOptions.kho.length <= 1) {
            setStatus({ message: 'Chỉ có một kho, không thể xuất hàng loạt.', type: 'error', progress: 0 });
            return;
        }
    
        setIsExporting(true);
        const originalKho = filterState.kho;
    
        try {
            const khosToExport = uniqueFilterOptions.kho.filter(k => k && k !== 'all');
            const overviewElement = document.getElementById('business-overview');
            const warehouseElement = document.getElementById('warehouse-summary-view');

            if (!overviewElement || !warehouseElement) {
                throw new Error('Không tìm thấy thành phần cần xuất (#business-overview or #warehouse-summary-view).');
            }
    
            for (const kho of khosToExport) {
                handleFilterChange({ kho });
                await new Promise(resolve => setTimeout(resolve, 1500));
    
                let rowToHighlight: Element | null = warehouseElement.querySelector(`tr[data-kho-id="${kho}"]`);
                if (rowToHighlight) {
                    rowToHighlight.classList.add('is-highlighted-for-export');
                }
                
                await new Promise(resolve => setTimeout(resolve, 200)); // Short delay for highlight to render

                // Export #1: Business Overview
                await exportElementAsImage(overviewElement, `tong-quan-kinh-doanh-${kho}.png`, {
                    elementsToHide: ['.hide-on-export'],
                    captureAsDisplayed: false,
                    isCompactTable: true,
                    forcedWidth: 700,
                });

                // Export #2: Warehouse Summary
                await exportElementAsImage(warehouseElement, `bao-cao-kho-${kho}.png`, {
                    elementsToHide: ['.hide-on-export'],
                    captureAsDisplayed: true,
                });
                
                if (rowToHighlight) {
                    rowToHighlight.classList.remove('is-highlighted-for-export');
                }
            }
        } catch (error) {
            console.error("Lỗi khi xuất hàng loạt theo kho:", error);
            setStatus({ message: 'Đã xảy ra lỗi trong quá trình xuất hàng loạt.', type: 'error', progress: 0 });
        } finally {
            handleFilterChange({ kho: originalKho });
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            setIsExporting(false);
        }
    };

    const handleClearDepartments = async () => {
        setIsClearingDepartments(true);
        try {
            await clearDepartmentMap();
            setDepartmentMap(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsClearingDepartments(false);
        }
    };
    
    const handleClearData = async () => {
        try {
            await clearSalesData();
            await clearCustomTabs();
            setOriginalData([]);
            setProcessedData(null);
            setFileInfo(null);
            setAppState('upload');
        } catch (error) {
            console.error(error);
        }
    };

    const handleShiftFileProcessing = async (files: File[]) => {
        if (files.length === 0) return;
        setAppState('loading');
        setIsProcessing(true);
        setStatus({ message: `Đang xử lý ${files.length} file phân ca...`, type: 'info', progress: 20 });
        try {
            let mergedMap: DepartmentMap = (await getDepartmentMap()) || {}; // Start with saved data if available

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setStatus({ message: `Đang xử lý file ${i + 1}/${files.length}: ${file.name}`, type: 'info', progress: 20 + (60 * (i + 1) / files.length) });
                const { map } = await processShiftFile(file); 
                mergedMap = { ...mergedMap, ...map }; // Merge the new map, overwriting duplicates
            }
            
            await saveDepartmentMap(mergedMap);
            setDepartmentMap(mergedMap);
            setStatus({ message: `Đã xử lý và gộp ${files.length} file phân ca!`, type: 'success', progress: 100 });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Lỗi không xác định";
            setStatus({ message: msg, type: 'error', progress: 0 });
        } finally {
            setIsProcessing(false);
            if(originalData.length > 0) setAppState('dashboard');
            else setAppState('upload');
        }
    };

    const handleFileProcessing = async (file: File) => {
        setAppState('loading');
        setIsProcessing(true);
        setStatus({ message: 'Khởi tạo tác vụ nền...', type: 'info', progress: 0 });
    
        if (!window.Worker) {
            setStatus({ message: 'Trình duyệt của bạn không hỗ trợ xử lý nền (Web Workers).', type: 'error', progress: 0 });
            setAppState('upload');
            setIsProcessing(false);
            return;
        }
    
        const workerCode = `
            importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

            // --- Start of Utilities ---
            const COL_WORKER = {
                DATE_CREATED: ['Ngày tạo'],
                TRANG_THAI_HUY: ['Trạng thái hủy'],
                TINH_TRANG_NHAP_TRA: ['Tình trạng nhập trả của sản phẩm đổi với sản phẩm chính'],
                TRANG_THAI_THU_TIEN: ['Trạng thái thu tiền'],
            };

            function getRowValue(row, keys) {
                for (const key of keys) {
                    if (row[key] !== undefined && row[key] !== null) return row[key];
                }
                return undefined;
            }

            function parseExcelDate(excelDate) {
                if (excelDate instanceof Date && !isNaN(excelDate.getTime())) return excelDate;
                if (typeof excelDate === 'number') {
                    return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                }
                if (typeof excelDate === 'string') {
                    const date = new Date(excelDate);
                    if (!isNaN(date.getTime())) return date;
                }
                return null;
            }

            function isValidSale(row) {
                const getString = (keys) => (getRowValue(row, keys) || '').toString().trim().toLowerCase();
                
                return getString(COL_WORKER.TRANG_THAI_HUY) === 'chưa hủy' &&
                       getString(COL_WORKER.TINH_TRANG_NHAP_TRA) === 'chưa trả' &&
                       getString(COL_WORKER.TRANG_THAI_THU_TIEN) === 'đã thu';
            }
            // --- End of Utilities ---

            self.onmessage = (event) => {
                const file = event.data;
                processFileInWorker(file);
            };

            async function processFileInWorker(file) {
                const postStatus = (status) => self.postMessage({ type: 'progress', payload: status });

                try {
                    postStatus({ message: 'Đang đọc file (nền)...', type: 'info', progress: 0 });
                    const arrayBuffer = await file.arrayBuffer();

                    postStatus({ message: 'Đang phân tích dữ liệu (nền)...', type: 'info', progress: 25 });
                    const data = new Uint8Array(arrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    postStatus({ message: 'Đang chuyển đổi dữ liệu (nền)...', type: 'info', progress: 50 });
                    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                    
                    postStatus({ message: 'Đang loại bỏ dữ liệu trùng lặp (nền)...', type: 'info', progress: 65 });
                    const getRowKey = (row) => {
                        const tempRow = { ...row };
                        // Không kiểm tra cột cuối của file dữ liệu "STT_1"
                        delete tempRow['STT_1']; 

                        const orderedRow = {};
                        Object.keys(tempRow).sort().forEach(key => {
                            orderedRow[key] = tempRow[key];
                        });
                        return JSON.stringify(orderedRow);
                    };

                    const uniqueRowKeys = new Set();
                    const deduplicatedData = [];
                    for (const row of json) {
                        const rowKey = getRowKey(row);
                        if (!uniqueRowKeys.has(rowKey)) {
                            uniqueRowKeys.add(rowKey);
                            deduplicatedData.push(row);
                        }
                    }

                    postStatus({ message: 'Lọc các đơn hàng hợp lệ (nền)...', type: 'info', progress: 75 });
                    const validData = deduplicatedData.filter(isValidSale);

                    postStatus({ message: 'Đang chuẩn hóa ngày tháng (nền)...', type: 'info', progress: 85 });
                    const processedData = validData
                        .map(row => ({
                            ...row,
                            parsedDate: parseExcelDate(getRowValue(row, COL_WORKER.DATE_CREATED)),
                        }))
                        .filter(row => row.parsedDate && !isNaN(row.parsedDate.getTime()));

                    if (processedData.length === 0) {
                        throw new Error("Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại file hoặc các điều kiện lọc.");
                    }

                    self.postMessage({ type: 'result', payload: processedData });

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định khi xử lý file";
                    self.postMessage({ type: 'error', payload: 'Lỗi: ' + errorMessage });
                }
            }
        `;
    
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
    
        const cleanup = () => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };
    
        worker.onmessage = async (e: MessageEvent<{ type: string, payload: any }>) => {
            const { type, payload } = e.data;
    
            if (type === 'progress') {
                setStatus(payload);
            } else if (type === 'result') {
                const data = payload as DataRow[];
                setStatus({ message: 'Đang lưu dữ liệu...', type: 'info', progress: 95 });
                await saveSalesData(data, file.name);
                setFileInfo({ filename: file.name, savedAt: new Date().toLocaleString('vi-VN') });
                setOriginalData(data);
                setStatus({ message: 'Đang tổng hợp báo cáo...', type: 'info', progress: 98 });
                setAppState('dashboard');
                cleanup();
            } else if (type === 'error') {
                setStatus({ message: payload, type: 'error', progress: 0 });
                setAppState('upload');
                setIsProcessing(false);
                cleanup();
            }
        };
    
        worker.onerror = (e) => {
            console.error('Lỗi Worker:', e);
            setStatus({ message: `Lỗi tác vụ nền: ${e.message}`, type: 'error', progress: 0 });
            setAppState('upload');
            setIsProcessing(false);
            cleanup();
        };
    
        worker.postMessage(file);
    };

    const handleSendMessage = useCallback(async (message: string) => {
        if (!processedData) return;
        
        setIsAiResponding(true);
        setChatHistory(prev => [...prev, { role: 'user', content: message }]);

        if (!chatSession.current) {
            chatSession.current = createChatSession(processedData);
        }

        try {
            const result = await chatSession.current.sendMessage({ message });
            setChatHistory(prev => [...prev, { role: 'model', content: result.text }]);
        } catch (error) {
            console.error("AI chat error:", error);
            setChatHistory(prev => [...prev, { role: 'model', content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại." }]);
        } finally {
            setIsAiResponding(false);
        }
    }, [processedData]);

    const openUnshippedModal = () => setActiveModal('unshipped');

    const handleExport = async (element: HTMLElement | null, filename: string, options: any = {}) => {
        if (element) {
            setIsExporting(true);
            const exportOptions = {
                elementsToHide: ['.hide-on-export'],
                ...options
            };
            await exportElementAsImage(element, filename, exportOptions);
            setIsExporting(false);
        }
    };
    
    return {
        status, appState, isProcessing, isClearingDepartments, isExporting, fileInfo,
        departmentMap, originalData, baseFilteredData, productConfig, processedData, employeeAnalysisData,
        configUrl, setConfigUrl, uniqueFilterOptions,
        filterState, handleFilterChange,
        activeModal, setActiveModal, modalData,
        isChatOpen, setIsChatOpen, chatHistory, isAiResponding,
        handleClearDepartments, handleClearData, handleShiftFileProcessing, handleFileProcessing,
        handleSendMessage, openPerformanceModal, openUnshippedModal, handleExport,
        handleBatchExport,
        handleBatchKhoExport
    };
};
