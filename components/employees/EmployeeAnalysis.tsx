
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useDashboardContext } from '../../contexts/DashboardContext';
import TopSellerList from './TopSellerList';
import PerformanceTable from './PerformanceTable';
import IndustryAnalysisTab from './IndustryAnalysisTab';
import HeadToHeadTab from './HeadToHeadTab';
import SummarySynthesisTab from './SummarySynthesisTab';
import ContestTable from './ContestTable';
import { Icon } from '../common/Icon';
import { exportElementAsImage } from '../../services/uiService';
import ModalWrapper from '../modals/ModalWrapper';
import type { ExploitationData } from '../../types';
import { getRowValue } from '../../utils/dataUtils';
import { COL } from '../../constants';
import { useEmployeeAnalysisLogic } from '../../hooks/useEmployeeAnalysisLogic';
import { TabModal, TableModal } from './modals/StructureModals';
import ColumnConfigModal from './modals/ColumnConfigModal';

export const ICON_OPTIONS = ['bar-chart-3', 'trophy', 'target', 'trending-up', 'star'];

declare const lucide: any;

const EmployeeAnalysis: React.FC = () => {
    const { employeeAnalysisData, openPerformanceModal, handleBatchExport, baseFilteredData, productConfig, originalData, handleExport, isExporting } = useDashboardContext();
    const [activeTab, setActiveTab] = useState('topSellers');
    
    // --- NEW STATE AND LOGIC FOR TAB VISIBILITY ---
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const settingsRef = useRef<HTMLDivElement>(null);
    const [isDeptFilterOpen, setIsDeptFilterOpen] = useState(false);
    const deptFilterRef = useRef<HTMLDivElement>(null);
    const [deptSearchTerm, setDeptSearchTerm] = useState('');

    const defaultTabs = [
        { id: 'topSellers', label: 'Top', icon: 'award' },
        { id: 'performanceTable', label: 'Hiệu Suất', icon: 'bar-chart-horizontal' },
        { id: 'industryAnalysis', label: 'Khai Thác', icon: 'gantt-chart-square' },
        { id: 'headToHead', label: '7 Ngày', icon: 'swords' },
        { id: 'summarySynthesis', label: 'Tổng Hợp', icon: 'sigma' },
    ];

    // Use Custom Hook for Logic
    const {
        customTabs,
        industryAnalysisTables,
        isInitialTabsLoaded,
        modalState,
        setModalState,
        isClosingModal,
        setIsClosingModal,
        handleSaveTab,
        handleSaveTable,
        handleSaveColumn,
        handleDeleteTab,
        handleDeleteTable,
        handleConfirmDeleteColumn
    } = useEmployeeAnalysisLogic(activeTab, setActiveTab, defaultTabs);

    const exportRef = useRef<HTMLDivElement>(null);
    const industryAnalysisTabRef = useRef<HTMLDivElement>(null);

    // --- SAFETY CLEANUP: Fix sticky export state ---
    useEffect(() => {
        // Chỉ chạy cleanup nếu KHÔNG đang trong quá trình export thực sự
        if (!isExporting) {
            // 1. Gỡ bỏ class chặn hiển thị trên body
            document.body.classList.remove('is-capturing');
            
            // 2. Tìm tất cả các phần tử bị ẩn và ép hiển thị lại
            const hiddenElements = document.querySelectorAll('.hide-on-export');
            hiddenElements.forEach((el) => {
                (el as HTMLElement).style.visibility = '';
                (el as HTMLElement).style.display = ''; // Restore display property
            });
        }
    }, [activeTab, isExporting]); // Chạy khi chuyển tab hoặc khi trạng thái export kết thúc

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (deptFilterRef.current && !deptFilterRef.current.contains(event.target as Node)) {
                setIsDeptFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const allAvailableTabs = useMemo(() => [
        ...defaultTabs,
        ...customTabs.map(t => ({ id: t.id, label: t.name, icon: t.icon }))
    ], [customTabs]);

    const [visibleTabs, setVisibleTabs] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('employeeAnalysis_visibleTabs');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return new Set(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load visible tabs from localStorage", e);
        }
        return new Set();
    });
    
    useEffect(() => {
        if (isInitialTabsLoaded) {
            const savedStateExists = localStorage.getItem('employeeAnalysis_visibleTabs') !== null;
            const allIds = new Set(allAvailableTabs.map(t => t.id));

            if (!savedStateExists && visibleTabs.size === 0) {
                setVisibleTabs(allIds);
            } else {
                setVisibleTabs(prev => {
                    const newSet = new Set(prev);
                    let hasChanged = false;
                    allIds.forEach(id => {
                        if (!prev.has(id)) {
                            newSet.add(id);
                            hasChanged = true;
                        }
                    });
                    prev.forEach(id => {
                        if (!allIds.has(id)) {
                            newSet.delete(id);
                            hasChanged = true;
                        }
                    });
                    return hasChanged ? newSet : prev;
                });
            }
        }
    }, [isInitialTabsLoaded, allAvailableTabs]);


    useEffect(() => {
        if (isInitialTabsLoaded && visibleTabs.size > 0) {
            try {
                localStorage.setItem('employeeAnalysis_visibleTabs', JSON.stringify(Array.from(visibleTabs)));
            } catch (e) {
                console.error("Failed to save visible tabs to localStorage", e);
            }
        }
    }, [visibleTabs, isInitialTabsLoaded]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggleTabVisibility = (tabId: string) => {
        setVisibleTabs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tabId)) {
                if (newSet.size === 1) return prev;
                newSet.delete(tabId);
            } else {
                newSet.add(tabId);
            }
            if (activeTab === tabId && !newSet.has(tabId)) {
                const firstVisibleId = allAvailableTabs.find(t => newSet.has(t.id))?.id;
                if (firstVisibleId) setActiveTab(firstVisibleId);
            }
            return newSet;
        });
    };
    
    const renderedDefaultTabs = defaultTabs.filter(t => visibleTabs.has(t.id));
    const renderedCustomTabs = customTabs.filter(t => visibleTabs.has(t.id));

    // Effect to close modal sequentially after a state update
    useEffect(() => {
        if (isClosingModal) {
            setModalState({ type: null });
            setIsClosingModal(false);
        }
    }, [isClosingModal]);

    // Ensure icons are rendered after state updates, but not while a modal is closing
    useEffect(() => {
        if (typeof lucide !== 'undefined' && modalState.type === null) {
            lucide.createIcons();
        }
    }, [customTabs, activeTab, modalState.type, visibleTabs]);

    const { allIndustries, allSubgroups, allManufacturers, allDepartments } = useMemo(() => {
        if (!productConfig || !originalData || !employeeAnalysisData) return { allIndustries: [], allSubgroups: [], allManufacturers: [], allDepartments: [] };
        const industries = new Set(Object.values(productConfig.childToParentMap));
        const subgroups = new Set<string>();
        Object.values(productConfig.subgroups).forEach(parent => {
            Object.keys(parent).forEach(subgroup => subgroups.add(subgroup));
        });
        const manufacturers = new Set<string>(originalData.map(row => getRowValue(row, COL.MANUFACTURER)).filter(Boolean));
        const depts = new Set<string>(employeeAnalysisData.fullSellerArray.map(emp => emp.department).filter(Boolean));
        return { 
            allIndustries: Array.from(industries).sort(), 
            allSubgroups: Array.from(subgroups).sort(),
            allManufacturers: Array.from(manufacturers).sort(),
            allDepartments: Array.from(depts).sort(),
        };
    }, [productConfig, originalData, employeeAnalysisData]);

     useEffect(() => {
        try {
            const saved = localStorage.getItem('employeeAnalysis_selectedDepartments');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && allDepartments.length > 0) {
                    const validDepts = parsed.filter(d => allDepartments.includes(d));
                    setSelectedDepartments(validDepts);
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to load selected departments from localStorage", e);
        }
        if (allDepartments.length > 0) {
            setSelectedDepartments(allDepartments);
        }
    }, [allDepartments]);

    useEffect(() => {
        try {
            localStorage.setItem('employeeAnalysis_selectedDepartments', JSON.stringify(selectedDepartments));
        } catch (e) {
            console.error("Failed to save selected departments to localStorage", e);
        }
    }, [selectedDepartments]);

    const filteredEmployeeAnalysisData = useMemo(() => {
        if (!employeeAnalysisData) return null;
        if (selectedDepartments.length === 0 || selectedDepartments.length === allDepartments.length) {
            return employeeAnalysisData;
        }
        const filteredFullSellerArray = employeeAnalysisData.fullSellerArray.filter(emp => selectedDepartments.includes(emp.department));
        const filteredExploitationData = employeeAnalysisData.exploitationData.filter(emp => selectedDepartments.includes(emp.department));
        return {
            ...employeeAnalysisData,
            fullSellerArray: filteredFullSellerArray,
            exploitationData: filteredExploitationData,
        };
    }, [employeeAnalysisData, selectedDepartments, allDepartments]);


    const renderActiveTab = () => {
        if (!isInitialTabsLoaded || !filteredEmployeeAnalysisData) return null;

        const colorThemes = [
            { header: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200', row: 'bg-emerald-100/50 dark:bg-emerald-900/30', border: 'border-emerald-500' },
            { header: 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200', row: 'bg-blue-100/50 dark:bg-blue-900/30', border: 'border-blue-500' },
            { header: 'bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200', row: 'bg-purple-100/50 dark:bg-purple-900/30', border: 'border-purple-500' },
            { header: 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200', row: 'bg-amber-100/50 dark:bg-amber-900/30', border: 'border-amber-500' },
            { header: 'bg-rose-100 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200', row: 'bg-rose-100/50 dark:bg-rose-900/30', border: 'border-rose-500' },
            { header: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-200', row: 'bg-cyan-100/50 dark:bg-cyan-900/30', border: 'border-cyan-500' },
            { header: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200', row: 'bg-indigo-100/50 dark:bg-indigo-900/30', border: 'border-indigo-500' },
            { header: 'bg-teal-100 dark:bg-teal-900/50 text-teal-900 dark:text-teal-200', row: 'bg-teal-100/50 dark:bg-teal-900/30', border: 'border-teal-500' },
            { header: 'bg-pink-100 dark:bg-pink-900/50 text-pink-900 dark:text-pink-200', row: 'bg-pink-100/50 dark:bg-pink-900/30', border: 'border-pink-500' },
            { header: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-900 dark:text-fuchsia-200', row: 'bg-fuchsia-100/50 dark:bg-fuchsia-900/30', border: 'border-fuchsia-500' },
            { header: 'bg-sky-100 dark:bg-sky-900/50 text-sky-900 dark:text-sky-200', row: 'bg-sky-100/50 dark:bg-sky-900/30', border: 'border-sky-500' },
        ];
        
        const handleMainExport = async () => {
            if (exportRef.current) {
                const filename = `phan-tich-nhan-vien-${activeTab}.png`;
                const options = activeTab === 'summarySynthesis' ? { isCompactTable: true } : {};
                await handleExport(exportRef.current, filename, options);
            }
        };

        const handleIndustryTabExport = async () => {
             if (industryAnalysisTabRef.current) {
                const filename = `phan-tich-nhan-vien-industryAnalysis.png`;
                await handleExport(industryAnalysisTabRef.current, filename, { isCompactTable: true });
            }
        };

        switch (activeTab) {
            case 'topSellers': return <TopSellerList ref={exportRef} fullSellerArray={filteredEmployeeAnalysisData.fullSellerArray} onEmployeeClick={openPerformanceModal} onBatchExport={handleBatchExport} onExport={handleMainExport} isExporting={isExporting} />;
            case 'performanceTable': return <PerformanceTable ref={exportRef} employeeData={filteredEmployeeAnalysisData} onEmployeeClick={openPerformanceModal} onExport={handleMainExport} isExporting={isExporting} />;
            case 'industryAnalysis': 
                return (
                    <div>
                        <IndustryAnalysisTab 
                            ref={industryAnalysisTabRef}
                            data={filteredEmployeeAnalysisData.exploitationData} 
                            onExport={handleIndustryTabExport} 
                            isExporting={isExporting}
                            onBatchExport={(exploitationData: ExploitationData[]) => {
                                const names = new Set(exploitationData.map(d => d.name));
                                if (filteredEmployeeAnalysisData?.fullSellerArray) {
                                    const employeesToExport = filteredEmployeeAnalysisData.fullSellerArray.filter(e => names.has(e.name));
                                    handleBatchExport(employeesToExport);
                                }
                            }}
                        />
                        <div className="mt-8">
                            <div className="flex justify-between items-center hide-on-export mb-4 flex-wrap gap-4">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Bảng Thi Đua Tùy Chỉnh (Khai Thác)</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setModalState({ type: 'CREATE_TABLE', data: { tabId: 'industryAnalysis' } })} className="inline-flex items-center gap-2 py-2 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                                        <Icon name="plus" size={4} /> Tạo Bảng Thi Đua Mới
                                    </button>
                                </div>
                            </div>
                            {industryAnalysisTables.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Chưa có bảng thi đua tùy chỉnh nào.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {industryAnalysisTables.map((tableConfig, index) => (
                                        <ContestTable
                                            key={tableConfig.id}
                                            config={tableConfig}
                                            allEmployees={filteredEmployeeAnalysisData.fullSellerArray}
                                            baseFilteredData={baseFilteredData}
                                            productConfig={productConfig!}
                                            tableColorTheme={colorThemes[(index + 1) % colorThemes.length]}
                                            onManageColumns={() => setModalState({ type: 'EDIT_TABLE', data: { tabId: 'industryAnalysis', tableId: tableConfig.id, tableName: tableConfig.tableName, columns: tableConfig.columns, initialSortColumnId: tableConfig.defaultSortColumnId } })}
                                            onDeleteTable={() => setModalState({ type: 'CONFIRM_DELETE_TABLE', data: { tabId: 'industryAnalysis', tableId: tableConfig.id, tableName: tableConfig.tableName } })}
                                            onAddColumn={() => setModalState({ type: 'CREATE_COLUMN', data: { tabId: 'industryAnalysis', tableId: tableConfig.id, existingColumns: tableConfig.columns } })}
                                            onEditColumn={(columnId) => setModalState({ type: 'EDIT_COLUMN', data: { tabId: 'industryAnalysis', tableId: tableConfig.id, existingColumns: tableConfig.columns, editingColumn: tableConfig.columns.find(c => c.id === columnId) } })}
                                            onTriggerDeleteColumn={(columnId) => setModalState({ type: 'CONFIRM_DELETE_COLUMN', data: { tabId: 'industryAnalysis', tableId: tableConfig.id, columnId: columnId, columnName: tableConfig.columns.find(c => c.id === columnId)?.columnName } })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'headToHead': return <HeadToHeadTab ref={exportRef} baseFilteredData={baseFilteredData} productConfig={productConfig!} employeeData={filteredEmployeeAnalysisData.fullSellerArray} onExport={handleMainExport} isExporting={isExporting} colorThemes={colorThemes} />;
            case 'summarySynthesis': return <SummarySynthesisTab ref={exportRef} baseFilteredData={baseFilteredData} productConfig={productConfig!} employeeData={filteredEmployeeAnalysisData.fullSellerArray} onExport={handleMainExport} isExporting={isExporting} />;
            default:
                const customTab = customTabs.find(t => t.id === activeTab);
                if (customTab) {
                    return (
                        <div ref={exportRef}>
                            <div className="flex justify-between items-center hide-on-export mb-4 flex-wrap gap-4">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{customTab.name}</h3>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => setModalState({ type: 'CREATE_TABLE', data: { tabId: customTab.id }})} className="inline-flex items-center gap-2 py-2 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                                        <Icon name="plus" size={4}/> Tạo Bảng Thi Đua Mới
                                    </button>
                                </div>
                            </div>
                            {customTab.tables.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Chưa có bảng thi đua nào trong tab này.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {customTab.tables.map((tableConfig, index) => (
                                        <ContestTable
                                            key={tableConfig.id}
                                            config={tableConfig}
                                            allEmployees={filteredEmployeeAnalysisData.fullSellerArray}
                                            baseFilteredData={baseFilteredData}
                                            productConfig={productConfig!}
                                            tableColorTheme={colorThemes[(index + 2) % colorThemes.length]}
                                            onManageColumns={() => setModalState({ type: 'EDIT_TABLE', data: { tabId: customTab.id, tableId: tableConfig.id, tableName: tableConfig.tableName, columns: tableConfig.columns, initialSortColumnId: tableConfig.defaultSortColumnId }})}
                                            onDeleteTable={() => setModalState({ type: 'CONFIRM_DELETE_TABLE', data: { tabId: customTab.id, tableId: tableConfig.id, tableName: tableConfig.tableName }})}
                                            onAddColumn={() => setModalState({ type: 'CREATE_COLUMN', data: { tabId: customTab.id, tableId: tableConfig.id, existingColumns: tableConfig.columns }})}
                                            onEditColumn={(columnId) => setModalState({ type: 'EDIT_COLUMN', data: { tabId: customTab.id, tableId: tableConfig.id, existingColumns: tableConfig.columns, editingColumn: tableConfig.columns.find(c => c.id === columnId) }})}
                                            onTriggerDeleteColumn={(columnId) => setModalState({ type: 'CONFIRM_DELETE_COLUMN', data: { tabId: customTab.id, tableId: tableConfig.id, columnId: columnId, columnName: tableConfig.columns.find(c => c.id === columnId)?.columnName }})}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }
                return null;
        }
    };
    
    // Find the current table for column management modal
    const currentTableForColumns = modalState.type === 'CREATE_COLUMN' || modalState.type === 'EDIT_COLUMN'
        ? (modalState.data.tabId === 'industryAnalysis' 
            ? industryAnalysisTables.find(t => t.id === modalState.data.tableId) 
            : customTabs.find(t => t.id === modalState.data.tabId)?.tables.find(t => t.id === modalState.data.tableId)
          )
        : undefined;

    return (
        <div className="chart-card rounded-xl flex flex-col flex-grow">
            <div className="flex justify-between items-end gap-y-2 border-b-2 border-slate-200 dark:border-slate-700 px-4">
                 <div className="flex items-end gap-1 overflow-x-auto">
                    {renderedDefaultTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 py-3 px-3 font-semibold text-sm transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                           <Icon name={tab.icon} /> {tab.label}
                        </button>
                    ))}
                    {renderedCustomTabs.map(tab => (
                        <div key={tab.id} className="group relative">
                             <button onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 py-3 px-3 font-semibold text-sm transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                               <Icon name={tab.icon} /> {tab.name}
                            </button>
                            <div className="absolute top-0 right-0 flex items-center transition-opacity hide-on-export">
                                 <button onClick={() => setModalState({ type: 'EDIT_TAB', data: { tabId: tab.id, initialName: tab.name, initialIcon: tab.icon }})} className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><Icon name="edit-3" size={3.5}/></button>
                                 <button onClick={() => setModalState({ type: 'CONFIRM_DELETE_TAB', data: { tabId: tab.id, tabName: tab.name }})} className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Icon name="trash-2" size={3.5}/></button>
                            </div>
                        </div>
                    ))}
                     <button onClick={() => setModalState({type: 'CREATE_TAB'})} title="Tạo tab thi đua mới" className="ml-2 mb-1 p-2 text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Icon name="plus-circle" />
                    </button>
                </div>
                 <div className="flex items-center gap-2 pb-2 hide-on-export">
                    {allDepartments.length > 0 && (
                        <div className="relative" ref={deptFilterRef}>
                            <button onClick={() => setIsDeptFilterOpen(p => !p)} title="Lọc theo bộ phận" className="relative p-2 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <Icon name="filter" />
                                {selectedDepartments.length > 0 && selectedDepartments.length < allDepartments.length && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white pointer-events-none">
                                        {selectedDepartments.length}
                                    </span>
                                )}
                            </button>
                            {isDeptFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-2 border border-slate-200 dark:border-slate-700 z-20 flex flex-col">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm bộ phận..."
                                        value={deptSearchTerm}
                                        onChange={e => setDeptSearchTerm(e.target.value)}
                                        className="w-full text-sm bg-slate-50 dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-2 px-2 py-1.5"
                                    />
                                    <div className="flex items-center border-b border-slate-200 dark:border-slate-600 pb-2 mb-2">
                                        <input id="select-all-depts" type="checkbox" checked={selectedDepartments.length === allDepartments.length && allDepartments.length > 0} onChange={(e) => setSelectedDepartments(e.target.checked ? allDepartments : [])} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="select-all-depts" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">Chọn tất cả</label>
                                    </div>
                                    <div className="flex-grow overflow-y-auto max-h-48">
                                        {allDepartments.filter(opt => opt.toLowerCase().includes(deptSearchTerm.toLowerCase())).map(option => (
                                            <div key={option} className="flex items-center p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600">
                                                <input id={`dept-opt-${option}`} type="checkbox" checked={selectedDepartments.includes(option)} onChange={() => {
                                                    setSelectedDepartments(prev => prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]);
                                                }} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <label htmlFor={`dept-opt-${option}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate">{option}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div ref={settingsRef} className="relative">
                        <button onClick={() => setIsSettingsOpen(prev => !prev)} title="Tùy chọn hiển thị" className="p-2 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <Icon name="settings" />
                        </button>
                        {isSettingsOpen && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-2 border border-slate-200 dark:border-slate-700 z-20">
                                <h4 className="font-bold text-sm mb-2 px-2 pt-2 text-slate-800 dark:text-slate-100">Ẩn/Hiện Tab</h4>
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                    {allAvailableTabs.map(tab => (
                                        <label key={tab.id} htmlFor={`vis-toggle-${tab.id}`} className="flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{tab.label}</span>
                                            <div className="relative inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleTabs.has(tab.id)}
                                                    onChange={() => handleToggleTabVisibility(tab.id)}
                                                    className="sr-only peer"
                                                    id={`vis-toggle-${tab.id}`}
                                                />
                                                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-500 peer-checked:bg-indigo-600"></div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-4 flex-grow">
                {renderActiveTab()}
            </div>
            
            {/* --- All Modals Rendered Here --- */}
            <TabModal
                isOpen={modalState.type === 'CREATE_TAB' || modalState.type === 'EDIT_TAB'}
                onClose={() => setModalState({type: null})}
                onSave={handleSaveTab}
                tabId={modalState.data?.tabId}
                initialName={modalState.data?.initialName}
                initialIcon={modalState.data?.initialIcon}
            />

            <TableModal
                isOpen={modalState.type === 'CREATE_TABLE' || modalState.type === 'EDIT_TABLE'}
                onClose={() => setModalState({ type: null })}
                onSave={handleSaveTable}
                initialName={modalState.data?.tableName || ''}
                isEditing={modalState.type === 'EDIT_TABLE'}
                columns={modalState.data?.columns}
                initialSortColumnId={modalState.data?.initialSortColumnId}
            />

            {(modalState.type === 'CREATE_COLUMN' || modalState.type === 'EDIT_COLUMN') && currentTableForColumns && (
                <ColumnConfigModal
                    isOpen={true}
                    onClose={() => setModalState({ type: null })}
                    onSave={handleSaveColumn}
                    allIndustries={allIndustries}
                    allSubgroups={allSubgroups}
                    allManufacturers={allManufacturers}
                    existingColumns={currentTableForColumns.columns}
                    editingColumn={modalState.data?.editingColumn}
                />
            )}

            
            <ModalWrapper
                isOpen={modalState.type === 'CONFIRM_DELETE_TAB'}
                onClose={() => setModalState({ type: null })}
                title="Xác nhận Xóa Tab"
                subTitle={`Bạn sắp xóa tab "${modalState.data?.tabName || ''}"`}
                titleColorClass="text-red-600 dark:text-red-400"
                maxWidthClass="max-w-md"
            >
                <div className="p-6">
                    <p>Hành động này không thể hoàn tác. Toàn bộ các bảng thi đua bên trong tab này cũng sẽ bị xóa vĩnh viễn.</p>
                </div>
                <div className="p-4 flex justify-end gap-3 bg-slate-100 dark:bg-slate-800 rounded-b-xl border-t border-slate-200 dark:border-slate-700">
                    <button onClick={() => setModalState({ type: null })} className="py-2 px-4 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors">Hủy</button>
                    <button onClick={handleDeleteTab} className="py-2 px-6 rounded-lg shadow-sm text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">Xác nhận Xóa</button>
                </div>
            </ModalWrapper>
            
            <ModalWrapper
                isOpen={modalState.type === 'CONFIRM_DELETE_TABLE'}
                onClose={() => setModalState({ type: null })}
                title="Xác nhận Xóa Bảng"
                subTitle={`Bạn sắp xóa bảng "${modalState.data?.tableName || ''}"`}
                titleColorClass="text-red-600 dark:text-red-400"
                maxWidthClass="max-w-md"
            >
                <div className="p-6">
                    <p>Hành động này sẽ xóa vĩnh viễn bảng thi đua này. Bạn có chắc chắn muốn tiếp tục?</p>
                </div>
                <div className="p-4 flex justify-end gap-3 bg-slate-100 dark:bg-slate-800 rounded-b-xl border-t border-slate-200 dark:border-slate-700">
                    <button onClick={() => setModalState({ type: null })} className="py-2 px-4 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors">Hủy</button>
                    <button onClick={handleDeleteTable} className="py-2 px-6 rounded-lg shadow-sm text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">Xác nhận Xóa</button>
                </div>
            </ModalWrapper>

            <ModalWrapper
                isOpen={modalState.type === 'CONFIRM_DELETE_COLUMN'}
                onClose={() => setModalState({ type: null })}
                title="Xác nhận Xóa Cột"
                subTitle={`Bạn sắp xóa cột "${modalState.data?.columnName || ''}"`}
                titleColorClass="text-red-600 dark:text-red-400"
                maxWidthClass="max-w-md"
            >
                <div className="p-6">
                    <p>Hành động này sẽ xóa vĩnh viễn cột này khỏi bảng. Bạn có chắc chắn muốn tiếp tục?</p>
                </div>
                <div className="p-4 flex justify-end gap-3 bg-slate-100 dark:bg-slate-800 rounded-b-xl border-t border-slate-200 dark:border-slate-700">
                    <button onClick={() => setModalState({ type: null })} className="py-2 px-4 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors">Hủy</button>
                    <button onClick={handleConfirmDeleteColumn} className="py-2 px-6 rounded-lg shadow-sm text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">Xác nhận Xóa</button>
                </div>
            </ModalWrapper>
            

        </div>
    );
};

export default EmployeeAnalysis;
