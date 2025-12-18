import React, { useState, useMemo, forwardRef, useRef, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { formatCurrency, abbreviateName, formatQuantity, getHeSoQuyDoi } from '../../utils/dataUtils';
import type { DataRow, ProductConfig, Employee } from '../../types';
import { getRowValue } from '../../utils/dataUtils';
import { COL, HINH_THUC_XUAT_THU_HO } from '../../constants';
import { getSummarySynthesisAnalysis } from '../../services/aiService';

// Định nghĩa một interface cục bộ để khớp với các thuộc tính thực sự được sử dụng
// khi thành phần này được dùng cho một tab tùy chỉnh.
interface CustomTabConfig {
    label: string;
    metricType: 'quantity' | 'revenue' | 'revenueQD';
    selectedIndustries: string[];
    selectedSubgroups: string[];
    selectedManufacturers: string[];
    productCodes: string[];
}


interface SummarySynthesisTabProps {
    baseFilteredData: DataRow[];
    productConfig: ProductConfig;
    employeeData: Employee[];
    isCustomTab?: boolean;
    customConfig?: CustomTabConfig;
    onExport?: () => void;
    isExporting?: boolean;
}

// Multi-select dropdown component with search
const MultiSelectDropdown: React.FC<{
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label: string;
}> = ({ options, selected, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleOption = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked ? options : []);
    };
    
    let displayLabel = `Tất cả ${label}`;
    if (selected.length > 0 && selected.length < options.length) {
        displayLabel = `${selected.length} ${label}`;
    }
    
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={containerRef} style={{ zIndex: 11 }}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="py-2 px-3 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between min-w-[180px]">
                <span className="truncate">{displayLabel}</span>
                <Icon name="chevron-down" size={4} className="ml-2" />
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-700 rounded-md shadow-lg border border-slate-200 dark:border-slate-600 p-2 flex flex-col">
                    <input
                        type="text"
                        placeholder={`Tìm kiếm ${label}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full text-sm bg-slate-50 dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-2 px-2 py-1.5"
                    />
                     <div className="flex items-center border-b border-slate-200 dark:border-slate-600 pb-2 mb-2">
                        <input id="select-all-summary-subgroups" type="checkbox" checked={selected.length === options.length} onChange={handleSelectAll} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="select-all-summary-subgroups" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">Chọn tất cả</label>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {filteredOptions.map(option => (
                            <div key={option} className="flex items-center p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600">
                                <input id={`summary-subgroup-${option}`} type="checkbox" checked={selected.includes(option)} onChange={() => handleToggleOption(option)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor={`summary-subgroup-${option}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate">{option}</label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SummarySynthesisTab = forwardRef<HTMLDivElement, SummarySynthesisTabProps>(({ baseFilteredData, productConfig, employeeData, isCustomTab, customConfig, onExport, isExporting }, ref) => {
    const [internalMetricType, setInternalMetricType] = useState<'revenue' | 'quantity'>('quantity');
    const [internalGroupMode, setInternalGroupMode] = useState<'parent' | 'subgroup'>('subgroup'); // New State: Mode selection
    const [internalSelectedGroups, setInternalSelectedGroups] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: isCustomTab ? 'value' : 'name', direction: isCustomTab ? 'desc' : 'asc' });
    const [isInitialFilterSet, setIsInitialFilterSet] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

    const tableColorTheme = {
        header: 'bg-sky-100 dark:bg-sky-900/50 text-sky-900 dark:text-sky-200',
        border: 'border-sky-500',
        row: 'bg-sky-50 dark:bg-sky-900/30',
    };
    const headerTextClasses = 'text-sky-800 dark:text-sky-200';

    // Determine which state to use
    const metricType = customConfig ? customConfig.metricType : internalMetricType;
    // For custom tabs, we might treat selectedSubgroups as the active filter, but for standard tab, use internalSelectedGroups
    const selectedGroups = customConfig ? customConfig.selectedSubgroups : internalSelectedGroups;
    
    const productSubgroups = useMemo(() => {
        const subgroups = new Set<string>();
        Object.values(productConfig.subgroups).forEach(parent => {
            Object.keys(parent).forEach(subgroup => subgroups.add(subgroup));
        });
        return Array.from(subgroups).sort();
    }, [productConfig]);

    const productParentGroups = useMemo(() => {
        return Array.from(new Set(Object.values(productConfig.childToParentMap))).sort();
    }, [productConfig]);

    // Available options depend on the selected mode
    const availableOptions = internalGroupMode === 'parent' ? productParentGroups : productSubgroups;

    useEffect(() => {
        if (!isCustomTab && availableOptions.length > 0) {
            // Logic to set default selections when switching modes or initial load
            if (internalGroupMode === 'subgroup') {
                 const defaultGroups = availableOptions.filter(g => ['Sim Online', 'Bảo hiểm', 'Đồng hồ Nam', 'Camera'].includes(g));
                 setInternalSelectedGroups(defaultGroups.length > 0 ? defaultGroups : availableOptions.slice(0, 4));
            } else {
                 // Default for parent groups
                 const defaultParents = availableOptions.filter(g => ['Sim', 'Bảo hiểm', 'Wearable', 'Phụ kiện'].includes(g));
                 setInternalSelectedGroups(defaultParents.length > 0 ? defaultParents : availableOptions.slice(0, 4));
            }
            setIsInitialFilterSet(true);
        }
    }, [availableOptions, internalGroupMode, isCustomTab]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const { rows, subgroupTotals, groupedRows, sortedDepartments, departmentTotals } = useMemo(() => {
        if (!baseFilteredData.length || !employeeData.length) {
            return { rows: [], subgroupTotals: new Map(), groupedRows: {}, sortedDepartments: [], departmentTotals: new Map() };
        }
    
        const validData = baseFilteredData.filter(row => !HINH_THUC_XUAT_THU_HO.has(getRowValue(row, COL.HINH_THUC_XUAT)));
    
        let tableRows;
    
        if (isCustomTab && customConfig) {
            // ... (Logic for Custom Tab remains unchanged for now, using existing filters)
             const filteredSalesData = validData.filter(row => {
                const industry = productConfig.childToParentMap[getRowValue(row, COL.MA_NHOM_HANG)] || '';
                const subgroup = productConfig.childToSubgroupMap[getRowValue(row, COL.MA_NHOM_HANG)] || '';
                const manufacturer = getRowValue(row, COL.MANUFACTURER) || '';
                const productCode = getRowValue(row, COL.MA_NHOM_HANG) || '';
                const filters = customConfig;
    
                if (!filters) return true;
    
                const industryMatch = filters.selectedIndustries.length === 0 || filters.selectedIndustries.includes(industry);
                const subgroupMatch = filters.selectedSubgroups.length === 0 || filters.selectedSubgroups.includes(subgroup);
                const manufacturerMatch = filters.selectedManufacturers.length === 0 || filters.selectedManufacturers.includes(manufacturer);
                const productCodeMatch = filters.productCodes.length === 0 || filters.productCodes.includes(productCode);
    
                return industryMatch && subgroupMatch && manufacturerMatch && productCodeMatch;
            });
    
            const salesByEmployee: { [emp: string]: number } = {};
            filteredSalesData.forEach(row => {
                const employee = getRowValue(row, COL.NGUOI_TAO);
                if (!employee) return;
                if (!salesByEmployee[employee]) salesByEmployee[employee] = 0;
    
                const quantity = Number(getRowValue(row, COL.QUANTITY)) || 0;
                const price = Number(getRowValue(row, COL.PRICE)) || 0;
                const revenue = price;
    
                if (metricType === 'quantity') {
                    salesByEmployee[employee] += quantity;
                } else if (metricType === 'revenue') {
                    salesByEmployee[employee] += revenue;
                } else {
                    const maNganhHang = getRowValue(row, COL.MA_NGANH_HANG);
                    const maNhomHang = getRowValue(row, COL.MA_NHOM_HANG);
                    const heso = getHeSoQuyDoi(maNganhHang, maNhomHang, productConfig);
                    salesByEmployee[employee] += revenue * heso;
                }
            });
    
            tableRows = employeeData.map(emp => ({
                name: emp.name,
                department: emp.department,
                value: salesByEmployee[emp.name] || 0,
                subgroupMetrics: new Map([['value', salesByEmployee[emp.name] || 0]])
            }));

        } else {
            // Standard Tab Logic with Mode Support
            if (selectedGroups.length === 0) return { rows: [], subgroupTotals: new Map(), groupedRows: {}, sortedDepartments: [], departmentTotals: new Map() };
    
            const salesByEmployeeByGroup: { [emp: string]: { [group: string]: { revenue: number, quantity: number } } } = {};
            
            validData.forEach(row => {
                const employee = getRowValue(row, COL.NGUOI_TAO);
                const maNhomHang = getRowValue(row, COL.MA_NHOM_HANG);
                
                // Determine group key based on selected mode
                const groupKey = internalGroupMode === 'parent'
                    ? productConfig.childToParentMap[maNhomHang]
                    : productConfig.childToSubgroupMap[maNhomHang];

                if (!employee || !groupKey || !selectedGroups.includes(groupKey)) return;

                const price = Number(getRowValue(row, COL.PRICE)) || 0;
                const quantity = Number(getRowValue(row, COL.QUANTITY)) || 0;
                const revenue = price;
    
                if (!salesByEmployeeByGroup[employee]) salesByEmployeeByGroup[employee] = {};
                if (!salesByEmployeeByGroup[employee][groupKey]) salesByEmployeeByGroup[employee][groupKey] = { revenue: 0, quantity: 0 };
    
                salesByEmployeeByGroup[employee][groupKey].revenue += revenue;
                salesByEmployeeByGroup[employee][groupKey].quantity += quantity;
            });
    
            tableRows = employeeData.map(employee => {
                const subgroupMetrics = new Map<string, number>();
                const employeeSales = salesByEmployeeByGroup[employee.name] || {};
                
                selectedGroups.forEach(group => {
                    const metric = employeeSales[group] ? employeeSales[group][metricType as 'revenue' | 'quantity'] : 0;
                    subgroupMetrics.set(group, metric);
                });
    
                return { name: employee.name, department: employee.department, subgroupMetrics };
            });
        }
    
        tableRows.sort((a, b) => {
            if (sortConfig.key === 'name') {
                const valA = a.name;
                const valB = b.name;
                return sortConfig.direction === 'asc' ? valA.localeCompare(b.name) : b.name.localeCompare(a.name);
            } else {
                const valA = a.subgroupMetrics.get(sortConfig.key) || 0;
                const valB = b.subgroupMetrics.get(sortConfig.key) || 0;
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            }
        });
    
        const subgroupTotals = new Map<string, number>();
        const columnsToTotal = isCustomTab ? ['value'] : selectedGroups;
        columnsToTotal.forEach(sg => {
            const total = tableRows.reduce((sum, row) => sum + (row.subgroupMetrics.get(sg) || 0), 0);
            subgroupTotals.set(sg, total);
        });
    
        const groupedRows = tableRows.reduce((acc, row) => {
            const dept = row.department || 'Không Phân Ca';
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(row);
            return acc;
        }, {} as Record<string, typeof tableRows>);
        
        const sortedDepartments = Object.keys(groupedRows).sort((a, b) => a.localeCompare(b));
        
        const departmentTotals = new Map<string, Map<string, number>>();
        sortedDepartments.forEach(dept => {
            const rowsInDept = groupedRows[dept];
            const deptTotals = new Map<string, number>();
            columnsToTotal.forEach(sg => {
                const total = rowsInDept.reduce((sum, row) => sum + (row.subgroupMetrics.get(sg) || 0), 0);
                deptTotals.set(sg, total);
            });
            departmentTotals.set(dept, deptTotals);
        });
    
        return { rows: tableRows, subgroupTotals, groupedRows, sortedDepartments, departmentTotals };
    }, [baseFilteredData, employeeData, productConfig, selectedGroups, metricType, sortConfig, isCustomTab, customConfig, internalGroupMode]);

    const handleAiAnalysis = async () => {
        setIsAnalysisLoading(true);
        setAnalysis(null);
        try {
            const result = await getSummarySynthesisAnalysis(rows, selectedGroups, metricType as 'revenue' | 'quantity');
            setAnalysis(result);
        } catch (error) {
            console.error("Lỗi khi phân tích tổng hợp:", error);
            setAnalysis("Đã xảy ra lỗi khi phân tích. Vui lòng thử lại.");
        } finally {
            setIsAnalysisLoading(false);
        }
    };

    const formatValue = (value: number) => {
        return metricType === 'revenue' || metricType === 'revenueQD' ? formatCurrency(value, 1) : formatQuantity(value);
    };

    const SortableHeader: React.FC<{ sortKey: string; children: React.ReactNode; }> = ({ sortKey, children }) => {
        return (
            <th onClick={() => handleSort(sortKey)} className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-sky-200/50 dark:hover:bg-sky-900/50 transition-colors whitespace-nowrap">
                {children}
            </th>
        );
    };
    
    const valueColumnHeader = metricType === 'quantity' ? 'Số Lượng' : metricType === 'revenue' ? 'Doanh Thu' : 'Doanh Thu QĐ';
    const columnsToRender = isCustomTab ? [{ id: 'value', label: valueColumnHeader }] : selectedGroups.map(sg => ({ id: sg, label: sg }));
    const showDeptHeaders = sortedDepartments.length > 1 || (sortedDepartments.length === 1 && sortedDepartments[0] !== 'Không Phân Ca');

    const buttonClasses = (isActive: boolean) => 
    `py-1.5 px-4 text-sm font-semibold rounded-md transition-all duration-200 transform hover:scale-105 ${
        isActive
        ? 'bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-200 shadow-lg ring-2 ring-sky-500/50 scale-105'
        : 'bg-white/40 dark:bg-slate-800/30 text-sky-900/70 dark:text-sky-200/70 hover:bg-white/80 dark:hover:bg-slate-800/60'
    }`;


    return (
        <div ref={ref}>
            {!isCustomTab && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hide-on-export mb-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2" style={{color: tableColorTheme.border.replace('border-','text-')}}>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Hiển thị:</span>
                            <button onClick={() => setInternalMetricType('revenue')} className={buttonClasses(internalMetricType === 'revenue')}>Doanh thu</button>
                            <button onClick={() => setInternalMetricType('quantity')} className={buttonClasses(internalMetricType === 'quantity')}>Số lượng</button>
                        </div>
                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>
                        <div className="flex items-center gap-2" style={{color: tableColorTheme.border.replace('border-','text-')}}>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loại nhóm:</span>
                            <button onClick={() => setInternalGroupMode('parent')} className={buttonClasses(internalGroupMode === 'parent')}>Ngành hàng (Cha)</button>
                            <button onClick={() => setInternalGroupMode('subgroup')} className={buttonClasses(internalGroupMode === 'subgroup')}>Nhóm hàng (Con)</button>
                        </div>
                         <div className="flex items-center gap-2 flex-grow">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-2">Chọn:</span>
                            <div className="flex-grow max-w-sm">
                                <MultiSelectDropdown
                                    options={availableOptions}
                                    selected={internalSelectedGroups}
                                    onChange={setInternalSelectedGroups}
                                    label={internalGroupMode === 'parent' ? 'Ngành hàng' : 'Nhóm hàng'}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className={`border rounded-lg overflow-hidden ${tableColorTheme.border}`}>
                <div 
                    className={`p-3 ${tableColorTheme.header} border-b-2 ${tableColorTheme.border}`}
                >
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold uppercase flex items-center gap-2">
                            <Icon name="sigma" size={4} />
                            <span>{isCustomTab ? customConfig?.label : 'Tổng Hợp Hiệu Suất'}</span>
                        </h3>
                        {!isCustomTab && (
                            <div className="flex items-center gap-1 hide-on-export">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAiAnalysis(); }}
                                    disabled={isAnalysisLoading}
                                    title="Phân tích bằng AI"
                                    className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isAnalysisLoading ? <Icon name="loader-2" size={4} className="animate-spin" /> : <Icon name="sparkles" size={4} />}
                                </button>
                                {onExport && (
                                    <button onClick={(e) => { e.stopPropagation(); onExport(); }} disabled={isExporting} title="Xuất Ảnh Tab" className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors">
                                        {isExporting ? <Icon name="loader-2" size={4} className="animate-spin" /> : <Icon name="camera" size={4} />}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto table-container">
                    <table className="min-w-full text-sm text-center table-auto compact-export-table">
                        <thead className={`${tableColorTheme.header}`}>
                            <tr className="divide-x divide-sky-200 dark:divide-sky-800">
                                <th onClick={() => handleSort('name')} className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-sky-200/50 dark:hover:bg-sky-900/50 transition-colors whitespace-nowrap bg-inherit text-left">
                                    Nhân Viên
                                </th>
                                {columnsToRender.map(col => <SortableHeader key={col.id} sortKey={col.id}>{col.label}</SortableHeader>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                           {sortedDepartments?.map(department => {
                                const rows = groupedRows[department];
                                const deptTotals = departmentTotals.get(department);
                                return (
                                    <React.Fragment key={department}>
                                        {showDeptHeaders && (
                                            <tr className={`border-t-2 ${tableColorTheme.border} ${tableColorTheme.row}`}>
                                                <td colSpan={1 + columnsToRender.length} className={`px-4 py-2 text-sm font-bold bg-inherit ${headerTextClasses}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon name="building-2" size={4} />
                                                        <span>{department}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {rows.map((row, rowIndex) => {
                                            const rowClass = rowIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : tableColorTheme.row;
                                            const medals = ['🥇', '🥈', '🥉'];
                                            const medal = rowIndex < 3 ? medals[rowIndex] : null;
                                            let rankDisplay;
                                            if (medal) {
                                                rankDisplay = <span className="text-xl w-6 text-center">{medal}</span>;
                                            } else {
                                                rankDisplay = <span className="text-xs w-6 text-center text-slate-400">#{rowIndex + 1}</span>;
                                            }
                                            return (
                                                <tr key={row.name} className={`${rowClass} divide-x divide-slate-200 dark:divide-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50`}>
                                                    <td className={`px-3 py-2 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap text-left`}>
                                                        <div className="flex items-center gap-2">
                                                            {rankDisplay}
                                                            <span>{abbreviateName(row.name)}</span>
                                                        </div>
                                                    </td>
                                                    {columnsToRender.map(col => (
                                                        <td key={col.id} className="px-3 py-2 font-medium">
                                                            {formatValue(row.subgroupMetrics.get(col.id) || 0)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                        {showDeptHeaders && deptTotals && (
                                            <tr className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 divide-x divide-slate-200 dark:divide-slate-700">
                                                <td className="px-3 py-2 text-left bg-inherit">Tổng Nhóm</td>
                                                {columnsToRender.map(col => (
                                                    <td key={col.id} className="px-3 py-2 font-semibold">
                                                        {formatValue(deptTotals.get(col.id) || 0)}
                                                    </td>
                                                ))}
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot className={`font-extrabold uppercase ${tableColorTheme.header}`}>
                            <tr className={`divide-x divide-sky-200 dark:divide-sky-800 border-t-2 ${tableColorTheme.border}`}>
                                <td className={`px-3 py-3 text-left ${tableColorTheme.header}`}>TỔNG CỘNG</td>
                                {columnsToRender.map(col => (
                                    <td key={col.id} className="px-3 py-3 font-semibold">
                                        {formatValue(subgroupTotals.get(col.id) || 0)}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            {!isCustomTab && (analysis || isAnalysisLoading) && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-slate-900/50 border border-indigo-200 dark:border-indigo-900/50 rounded-lg">
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                        <Icon name="sparkles" />
                        AI Phân Tích Tổng Hợp
                    </h4>
                    {isAnalysisLoading ? (
                        <div className="space-y-2 mt-2">
                            <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded h-4 w-full"></div>
                            <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded h-4 w-3/4"></div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">
                            {analysis}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
});

export default SummarySynthesisTab;