







import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// @ts-ignore
import { GoogleGenAI } from '@google/genai';

import {
    initDB,
    saveViewToDB,
    getAllViewsFromDB,
    deleteViewFromDB,
    parseDoanhThuData,
    parseThiDuaData,
    parseTraGopData,
} from './services';
import { Header, ChangelogModal, Toast, LoadingOverlay, AICompanion, InputTabs } from './Shared';
import DoanhThuTab from './DoanhThuTab';
import ThiDuaTab from './ThiDuaTab';
import TraGopTab from './TraGopTab';

// FIX: Add global declaration for html2canvas to resolve TypeScript errors.
declare const html2canvas: any;

const EmployeeEfficiencyView: React.FC = () => {
    // UI State
    const [activeTab, setActiveTab] = useState('doanhthu');
    const [isChangelogOpen, setChangelogOpen] = useState(false);
    const [toast, setToast] = useState<{message: string, isError: boolean} | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Comparison Mode State
    const [isComparisonMode, setComparisonMode] = useState(false);

    // Raw Text Input State - Initialize from localStorage
    const [doanhThuText, setDoanhThuText] = useState(() => localStorage.getItem('doanhThuText_v1') || '');
    const [doanhThuText_prev, setDoanhThuText_prev] = useState(() => localStorage.getItem('doanhThuText_prev_v1') || '');
    const [thiDuaText, setThiDuaText] = useState(() => localStorage.getItem('thiDuaText_v1') || '');
    const [traGopText, setTraGopText] = useState(() => localStorage.getItem('traGopText_v1') || '');

    // Processed Data State
    const [doanhThuData, setDoanhThuData] = useState<any>(null);
    const [doanhThuData_prev, setDoanhThuData_prev] = useState<any>(null);
    const [thiDuaData, setThiDuaData] = useState<any>(null);
    const [traGopData, setTraGopData] = useState<any>(null);

    // Doanh Thu Control State
    const [doanhThuSort, setDoanhThuSort] = useState({ key: 'DTQĐ', order: 'desc' });
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [doanhThuViewMode, setDoanhThuViewMode] = useState('card');
    const isFirstDoanhThuLoad = useRef(true);

    // Thi Dua Control State
    const [thiDuaSort, setThiDuaSort] = useState({ key: 'effectiveness', order: 'desc' });
    const [selectedThiDuaDepts, setSelectedThiDuaDepts] = useState<string[]>([]);
    const [selectedThiDuaGroups, setSelectedThiDuaGroups] = useState<string[]>([]);
    const [thiDuaColumnOrder, setThiDuaColumnOrder] = useState<any[]>([]);
    const [currentCriteria, setCurrentCriteria] = useState('All');
    const [savedViews, setSavedViews] = useState<any[]>([]);
    const [isThiDuaViewDirty, setIsThiDuaViewDirty] = useState(false);
    const isFirstThiDuaLoad = useRef(true);

    const showToast = (message: string, isError = false) => {
        setToast({ message, isError });
        setTimeout(() => setToast(null), 3300);
    };

    // Auto-save input text to localStorage
    useEffect(() => { try { localStorage.setItem('doanhThuText_v1', doanhThuText); } catch (e) { console.error(`Failed to save Doanh Thu text: ${String(e)}`); } }, [doanhThuText]);
    useEffect(() => { try { localStorage.setItem('doanhThuText_prev_v1', doanhThuText_prev); } catch (e) { console.error(`Failed to save previous Doanh Thu text: ${String(e)}`); } }, [doanhThuText_prev]);
    useEffect(() => { try { localStorage.setItem('thiDuaText_v1', thiDuaText); } catch (e) { console.error(`Failed to save Thi Dua text: ${String(e)}`); } }, [thiDuaText]);
    useEffect(() => { try { localStorage.setItem('traGopText_v1', traGopText); } catch (e) { console.error(`Failed to save Tra Gop text: ${String(e)}`); } }, [traGopText]);

    // Unload warning effect
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (activeTab === 'thidua' && isThiDuaViewDirty) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isThiDuaViewDirty, activeTab]);

    // Data Processing Effects
    useEffect(() => {
        try {
            const data = parseDoanhThuData(doanhThuText);
            setDoanhThuData(data);
            if (isFirstDoanhThuLoad.current && data?.employees.length > 0) {
                isFirstDoanhThuLoad.current = false;
                const availableDepts = [...new Set(data.employees.map((e:any) => e.department))].filter(d => !['BP Quản Lý Siêu Thị', 'BP Trưởng Ca'].includes(d as string));
                if (availableDepts.length > 0) {
                    setSelectedDepartments([availableDepts[0] as string]);
                }
            } else if (!data || data.employees.length === 0) {
                setSelectedDepartments([]);
                isFirstDoanhThuLoad.current = true;
            }
        } catch (error) {
            console.error(`Error parsing Doanh Thu data: ${String(error)}`);
            showToast("Lỗi xử lý dữ liệu Doanh Thu.", true);
        }
    }, [doanhThuText]);

    useEffect(() => {
        try {
            if (isComparisonMode && doanhThuText_prev) {
                const data = parseDoanhThuData(doanhThuText_prev);
                setDoanhThuData_prev(data);
            } else {
                setDoanhThuData_prev(null);
            }
        } catch (error) {
            console.error(`Error parsing Previous Doanh Thu data: ${String(error)}`);
            showToast("Lỗi xử lý dữ liệu Doanh Thu kỳ trước.", true);
        }
    }, [doanhThuText_prev, isComparisonMode]);

    useEffect(() => {
        try {
            const data = parseThiDuaData(thiDuaText);
            setThiDuaData(data);
            if (data?.headers1) {
                const initialColumns: any[] = [];
                for (let i = 1; i < data.headers1.length; i++) {
                    if (data.headers1[i]) {
                        let span = 1;
                        while (i + span < data.headers1.length && !data.headers1[i + span]) {
                            span++;
                        }
                        initialColumns.push({ originalStartIndex: i, span });
                        i += span - 1;
                    }
                }
                setThiDuaColumnOrder(initialColumns);
                if (isFirstThiDuaLoad.current && data.body.length > 0) {
                    isFirstThiDuaLoad.current = false;
                    // FIX: Add type guard to ensure `allDepts` is `string[]` and handle potential `undefined` from `find`.
                    const allDepts = [...new Set(data.body.map((row: any[]) => row[0]))].filter(
                        (cell: any): cell is string => typeof cell === 'string' && (cell.toLowerCase().startsWith('bp ') || cell.toLowerCase().includes('tổng'))
                    );
                    const tongDept = allDepts.find(d => d.toLowerCase().includes('tổng'));
                    const firstRealDept = allDepts.find(d => d.toLowerCase().startsWith('bp '));
                    const initialSelection: string[] = [];
                    if (tongDept) {
                        initialSelection.push(tongDept);
                    }
                    if (firstRealDept) {
                        initialSelection.push(firstRealDept);
                    }
                    if (initialSelection.length > 0) {
                        setSelectedThiDuaDepts(initialSelection);
                    } else {
                        setSelectedThiDuaDepts(allDepts.slice(0, 2));
                    }
                } else if (!data || data.body.length === 0) {
                    setSelectedThiDuaDepts([]);
                    isFirstThiDuaLoad.current = true;
                }
            } else {
                setThiDuaColumnOrder([]);
                setSelectedThiDuaDepts([]);
                isFirstThiDuaLoad.current = true;
            }
        } catch (error) {
            console.error(`Error parsing Thi Dua data: ${String(error)}`);
            showToast("Lỗi xử lý dữ liệu Thi Đua.", true);
        }
    }, [thiDuaText]);

    useEffect(() => {
        try {
            const data = parseTraGopData(traGopText);
            setTraGopData(data);
        } catch (error) {
            console.error(`Error parsing Tra Gop data: ${String(error)}`);
            showToast("Lỗi xử lý dữ liệu Trả Góp.", true);
        }
    }, [traGopText]);

    const loadViews = useCallback(async () => {
        const views = await getAllViewsFromDB();
        setSavedViews(views);
    }, []);

    // DB and initial load effect
    useEffect(() => {
        const initialize = async () => {
            try {
                await initDB();
                await loadViews();
            } catch (error) {
                console.error(`Failed to initialize DB: ${String(error)}`);
                showToast("Không thể khởi tạo cơ sở dữ liệu cho phiên bản.", true);
            }
        };
        initialize();
    }, [loadViews]);

    const { processedDoanhThuData, departmentStats } = useMemo(() => {
        if (!doanhThuData || !doanhThuData.employees) {
            return {
                processedDoanhThuData: new Map(),
                departmentStats: new Map()
            };
        }
        let filteredEmployees = doanhThuData.employees;
        if (selectedDepartments.length > 0) {
            filteredEmployees = doanhThuData.employees.filter((e: any) => selectedDepartments.includes(e.department));
        }
        if (isComparisonMode && doanhThuData_prev?.employees) {
            const prevEmployeeMap = new Map(doanhThuData_prev.employees.map((e: any) => [e.rowData[0].trim(), e.metrics]));
            filteredEmployees = filteredEmployees.map((emp: any) => {
                const prevMetrics = prevEmployeeMap.get(emp.rowData[0].trim());
                if (prevMetrics) {
                    return {
                        ...emp,
                        prevMetrics,
                        deltaMetrics: {
                            'DTQĐ': emp.metrics['DTQĐ'] - prevMetrics['DTQĐ'],
                            'DTLK': emp.metrics['DTLK'] - prevMetrics['DTLK'],
                            'Hiệu quả QĐ': emp.metrics['Hiệu quả QĐ'] - prevMetrics['Hiệu quả QĐ'],
                        }
                    };
                }
                return emp;
            });
        }
        const departmentsMap = new Map();
        filteredEmployees.forEach((emp: any) => {
            if (!departmentsMap.has(emp.department)) {
                departmentsMap.set(emp.department, []);
            }
            departmentsMap.get(emp.department).push(emp);
        });
        const deptStats = new Map();
        departmentsMap.forEach((employees, department) => {
            const count = employees.length;
            if (count > 0) {
                const totalDTQD = employees.reduce((sum: number, e: any) => sum + e.metrics['DTQĐ'], 0);
                const totalDTLK = employees.reduce((sum: number, e: any) => sum + e.metrics['DTLK'], 0);
                const totalHQD = employees.reduce((sum: number, e: any) => sum + e.metrics['Hiệu quả QĐ'], 0);
                deptStats.set(department, {
                    avgDTQD: totalDTQD / count,
                    avgDTLK: totalDTLK / count,
                    avgHQD: totalHQD / count,
                });
            }
        });
        departmentsMap.forEach((employees) => {
            employees.sort((a: any, b: any) => {
                const valA = a.metrics[doanhThuSort.key] || 0;
                const valB = b.metrics[doanhThuSort.key] || 0;
                return doanhThuSort.order === 'desc' ? valB - valA : valA - valB;
            });
            employees.forEach((emp: any, index: number) => emp.rank = index + 1);
        });
        return { processedDoanhThuData: departmentsMap, departmentStats: deptStats };
    }, [doanhThuData, doanhThuData_prev, isComparisonMode, doanhThuSort, selectedDepartments]);
    
    // Handlers
    const handleSaveView = async (name: string) => {
        if (!name) {
            showToast('Vui lòng nhập tên cho phiên bản.', true);
            return;
        }
        const newView = {
            name,
            columnOrderInfo: thiDuaColumnOrder,
            selectedDepartments: selectedThiDuaDepts,
            selectedGroups: selectedThiDuaGroups,
            criteriaType: currentCriteria,
            sort: thiDuaSort,
        };
        await saveViewToDB(newView);
        await loadViews();
        setIsThiDuaViewDirty(false);
        showToast(`Đã lưu phiên bản "${name}"!`);
    };

    const handleLoadView = (view: any) => {
        setThiDuaColumnOrder(view.columnOrderInfo || []);
        setSelectedThiDuaDepts(view.selectedDepartments || []);
        setSelectedThiDuaGroups(view.selectedGroups || []);
        setThiDuaSort(view.sort || { key: 'effectiveness', order: 'desc' });
        setCurrentCriteria(view.criteriaType || 'All');
        setIsThiDuaViewDirty(false);
        showToast(`Đã tải phiên bản "${view.name}".`);
    };

    const handleDeleteView = async (name: string) => {
        await deleteViewFromDB(name);
        await loadViews();
        showToast(`Đã xoá phiên bản "${name}".`);
    };

    const handleResetThiDuaColumns = () => {
        if (!thiDuaData?.headers1) return;
        const initialColumns: any[] = [];
        for (let i = 1; i < thiDuaData.headers1.length; i++) {
            if (thiDuaData.headers1[i]) {
                let span = 1;
                while (i + span < thiDuaData.headers1.length && !thiDuaData.headers1[i + span]) span++;
                initialColumns.push({ originalStartIndex: i, span });
                i += span - 1;
            }
        }
        setThiDuaColumnOrder(initialColumns);
        setIsThiDuaViewDirty(false);
        showToast('Đã đặt lại thứ tự cột.');
    };
    
    // Export Handlers
    const handleExportAllDoanhThu = async (exportAllBtnRef: React.RefObject<HTMLButtonElement>) => {
        const originalSort = doanhThuSort;
        const originalViewMode = doanhThuViewMode;
        const criteriaToExport = ['DTQĐ', 'DTLK', 'Hiệu quả QĐ'];
        setIsLoading(true);
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        try {
            for (const key of criteriaToExport) {
                setDoanhThuSort({ key, order: 'desc' });
                await delay(500);
                const panelId = "results-panel-doanhthu";
                const captureElement = document.getElementById(panelId);
                if (!captureElement) continue;
                const canvas = await html2canvas(captureElement, {
                    scale: 5,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc: Document) => {
                        const panel = clonedDoc.getElementById(captureElement.id);
                        if (!panel) return;
                        const stickyElements = panel.querySelectorAll('[class*="sticky"]');
                        stickyElements.forEach(el => { (el as HTMLElement).style.position = 'static'; });
                        const tableContainer = panel.querySelector('.overflow-x-auto') as HTMLElement;
                        if (tableContainer) {
                            tableContainer.style.overflow = 'visible';
                            tableContainer.style.width = 'auto';
                            panel.style.width = 'fit-content';
                        } else {
                            panel.style.width = 'fit-content';
                            panel.style.minWidth = '700px';
                        }
                        const doanhThuRows = panel.querySelectorAll('.doanhthu-result-row');
                        doanhThuRows.forEach(row => {
                            const rowEl = row as HTMLElement;
                            rowEl.style.display = 'grid';
                            rowEl.style.gridTemplateColumns = '48px 1fr 112px';
                            rowEl.style.alignItems = 'center';
                            const secondaryMetricsEl = row.querySelector('.secondary-metrics-container') as HTMLElement;
                            if (secondaryMetricsEl) {
                                secondaryMetricsEl.style.overflowX = 'visible';
                                secondaryMetricsEl.style.whiteSpace = 'normal';
                                secondaryMetricsEl.style.minHeight = '1.5rem';
                                const metricSpans = secondaryMetricsEl.querySelectorAll('span');
                                metricSpans.forEach(span => {
                                    span.style.whiteSpace = 'normal';
                                });
                            }
                        });
                    }
                });
                const link = document.createElement('a');
                const keyText = key === 'Hiệu quả QĐ' ? 'HieuQuaQD' : key;
                link.download = `bao-cao-doanh-thu-${keyText}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                await delay(300);
            }
            showToast('Đã xuất tất cả báo cáo doanh thu thành công!');
        } catch (err: any) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Lỗi khi xuất hàng loạt doanh thu: ${message}`);
            showToast("Có lỗi xảy ra khi xuất hàng loạt.", true);
        } finally {
            setDoanhThuSort(originalSort);
            setDoanhThuViewMode(originalViewMode);
            setIsLoading(false);
        }
    };

    const handleExportAllThiDua = async (exportAllBtnRef: React.RefObject<HTMLButtonElement>) => {
        const originalCriteria = currentCriteria;
        const criteriaToExport = ['All', 'SLLK', 'DTQĐ', 'DTLK'];
        setIsLoading(true);
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        try {
            for (const criteria of criteriaToExport) {
                setCurrentCriteria(criteria);
                await delay(500);
                const panelId = "results-panel-thidua";
                const captureElement = document.getElementById(panelId);
                const buttonElement = exportAllBtnRef.current;
                if (!captureElement || !buttonElement) continue;
                const canvas = await html2canvas(captureElement, {
                    scale: 5,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc: Document) => {
                        const panel = clonedDoc.getElementById(captureElement.id);
                        if (!panel) return;
                        const stickyElements = panel.querySelectorAll('[class*="sticky"]');
                        stickyElements.forEach(el => { (el as HTMLElement).style.position = 'static'; });
                        const tableContainer = panel.querySelector('.overflow-x-auto') as HTMLElement;
                        if (tableContainer) {
                            tableContainer.style.overflow = 'visible';
                            tableContainer.style.width = 'auto';
                            panel.style.width = 'fit-content';
                        }
                    }
                });
                const link = document.createElement('a');
                link.download = `bao-cao-thi-dua-${criteria}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                await delay(300);
            }
            showToast('Đã xuất tất cả báo cáo thành công!');
        } catch (err: any) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Lỗi khi xuất hàng loạt: ${message}`);
            showToast("Có lỗi xảy ra khi xuất hàng loạt.", true);
        } finally {
            setCurrentCriteria(originalCriteria);
            setIsLoading(false);
        }
    };

    const allDepartments = useMemo(() =>
        [...new Set(doanhThuData?.employees.map((e: any) => e.department) || [])]
        .filter((dept: string) => !['BP Quản Lý Siêu Thị', 'BP Trưởng Ca'].includes(dept)), [doanhThuData]
    );

    return (
        <div id="employee-efficiency-view">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-7xl my-4 mx-auto">
                <Header onVersionClick={() => setChangelogOpen(true)} />
                <InputTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    doanhThuText={doanhThuText}
                    setDoanhThuText={(text: string) => { setDoanhThuText(text); showToast('Đã xử lý dữ liệu Doanh thu!'); }}
                    thiDuaText={thiDuaText}
                    setThiDuaText={(text: string) => { setThiDuaText(text); showToast('Đã xử lý dữ liệu Thi đua!'); }}
                    traGopText={traGopText}
                    setTraGopText={(text: string) => { setTraGopText(text); showToast('Đã xử lý dữ liệu Trả góp!'); }}
                    showToast={showToast}
                    isComparisonMode={isComparisonMode}
                    setComparisonMode={setComparisonMode}
                    doanhThuText_prev={doanhThuText_prev}
                    setDoanhThuText_prev={(text: string) => { setDoanhThuText_prev(text); showToast('Đã xử lý dữ liệu Doanh thu kỳ trước!'); }}
                />
                
                {activeTab === 'doanhthu' && <DoanhThuTab
                    processedData={processedDoanhThuData}
                    departmentStats={departmentStats}
                    isComparisonMode={isComparisonMode}
                    sortState={doanhThuSort}
                    setSortState={setDoanhThuSort}
                    allDepartments={allDepartments}
                    selectedDepartments={selectedDepartments}
                    setSelectedDepartments={setSelectedDepartments}
                    onExportAll={handleExportAllDoanhThu}
                    viewMode={doanhThuViewMode}
                    setViewMode={setDoanhThuViewMode}
                    headers={doanhThuData?.headers || []}
                    showToast={showToast}
                    setIsLoading={setIsLoading}
                />}
                
                {activeTab === 'thidua' && <ThiDuaTab
                    data={thiDuaData}
                    sort={thiDuaSort}
                    setSort={(s: any) => { setThiDuaSort(s); setIsThiDuaViewDirty(true); }}
                    columnOrder={thiDuaColumnOrder}
                    setColumnOrder={(co: any) => { setThiDuaColumnOrder(co); setIsThiDuaViewDirty(true); }}
                    selectedDepartments={selectedThiDuaDepts}
                    setSelectedDepartments={(depts: string[]) => { setSelectedThiDuaDepts(depts); setIsThiDuaViewDirty(true); }}
                    selectedGroups={selectedThiDuaGroups}
                    setSelectedGroups={(groups: string[]) => { setSelectedThiDuaGroups(groups); setIsThiDuaViewDirty(true); }}
                    currentCriteria={currentCriteria}
                    setCurrentCriteria={(criteria: string) => { setCurrentCriteria(criteria); setIsThiDuaViewDirty(true); }}
                    onResetColumns={handleResetThiDuaColumns}
                    onExportAll={handleExportAllThiDua}
                    savedViews={savedViews}
                    onSaveView={handleSaveView}
                    onLoadView={handleLoadView}
                    onDeleteView={handleDeleteView}
                    setIsLoading={setIsLoading}
                    showToast={showToast}
                />}

                {activeTab === 'tragop' && <TraGopTab data={traGopData} />}

            </div>

            <Toast toast={toast} />
            <ChangelogModal isOpen={isChangelogOpen} onClose={() => setChangelogOpen(false)} />
            <LoadingOverlay isLoading={isLoading} />
            <AICompanion showToast={showToast} />
        </div>
    );
};

export default EmployeeEfficiencyView;