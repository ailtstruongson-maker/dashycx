
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { WarehouseColumnConfig, WarehouseMetricType } from '../../types';
import { Icon } from '../common/Icon';
import { useDashboardContext } from '../../contexts/DashboardContext';
import { getWarehouseColumnConfig, saveWarehouseColumnConfig } from '../../services/dbService';
import { COL, WAREHOUSE_HEADER_COLORS, DEFAULT_WAREHOUSE_COLUMNS } from '../../constants';
import { getRowValue } from '../../utils/dataUtils';
import LoadingOverlay from '../common/LoadingOverlay';
import WarehouseSettingsModal from './WarehouseSettingsModal';
import { useWarehouseLogic } from '../../hooks/useWarehouseLogic';

interface WarehouseSummaryProps {
    onBatchExport: () => Promise<void>;
}

const WarehouseSummary: React.FC<WarehouseSummaryProps> = ({ onBatchExport }) => {
    const { processedData, productConfig, originalData, handleExport, isExporting, isProcessing, uniqueFilterOptions } = useDashboardContext();
    const data = processedData?.warehouseSummary ?? [];
    
    const summaryRef = useRef<HTMLDivElement>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'doanhThuQD', direction: 'desc' });
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    
    const [columns, setColumns] = useState<WarehouseColumnConfig[]>([]);

    const { sortedData, totals, customTotals, customProductColumnValues, getColumnValue } = useWarehouseLogic({
        data,
        columns,
        originalData,
        productConfig,
        sortConfig
    });

    const getHqqdClass = (hqqdValue: number | undefined): string => {
        if (hqqdValue === undefined || isNaN(hqqdValue)) return 'text-slate-600 dark:text-slate-300';
        if (hqqdValue < 30) return 'text-red-700 dark:text-red-500 font-bold';
        if (hqqdValue < 35) return 'text-red-500 dark:text-red-400';
        return 'text-green-600 dark:text-green-500';
    };

    const getTraChamPercentClass = (percentage: number | undefined) => {
        if (percentage === undefined || isNaN(percentage)) return 'text-slate-600 dark:text-slate-300';
        if (percentage >= 45) return 'text-green-600 dark:text-green-500';
        if (percentage >= 40) return 'text-amber-600 dark:text-amber-500';
        return 'text-red-600 dark:text-red-500 font-bold';
    };

    const formatRevenueForKho = (value: number | undefined): string => {
        if (value === undefined || isNaN(value) || value === 0) return '-';
        return Math.round(value / 1000000).toLocaleString('vi-VN');
    };
    
    const formatQuantityForKho = (value: number | undefined): string => {
        if (value === undefined || isNaN(value) || value === 0) return '-';
        return Math.round(value).toLocaleString('vi-VN');
    };
    
    const handleSingleExport = async () => {
        if (summaryRef.current) {
            await handleExport(summaryRef.current, 'bao-cao-kho.png', {
                elementsToHide: ['.hide-on-export'],
                captureAsDisplayed: true,
            });
        }
    };

    const { allIndustries, allGroups, allManufacturers } = useMemo(() => {
        if (!productConfig || !originalData) return { allIndustries: [], allGroups: [], allManufacturers: [] };
        const industries = new Set<string>();
        const groups = new Set<string>();
        Object.keys(productConfig.childToParentMap).forEach(childKey => industries.add(productConfig.childToParentMap[childKey]));
        Object.values(productConfig.subgroups).forEach(parent => Object.keys(parent).forEach(subgroup => groups.add(subgroup)));
        const dataRows = originalData;
        const manufacturers = new Set<string>(dataRows.map(row => getRowValue(row, COL.MANUFACTURER)).filter(Boolean));
        return { 
            allIndustries: Array.from(industries).sort(), 
            allGroups: Array.from(groups).sort(),
            allManufacturers: Array.from(manufacturers).sort(),
        };
    }, [productConfig, originalData]);

    useEffect(() => {
        const loadConfig = async () => {
            let config = await getWarehouseColumnConfig();
            if (!config || config.length === 0) {
                config = [...DEFAULT_WAREHOUSE_COLUMNS];
                await saveWarehouseColumnConfig(config);
            }
            setColumns(config);
        };
        loadConfig();
    }, [allIndustries, allGroups]);

    const handleSaveColumns = (newColumns: WarehouseColumnConfig[]) => {
        setColumns(newColumns);
        saveWarehouseColumnConfig(newColumns).catch(err => console.error("Failed to save column config:", err));
    };
    
    if (!data || data.length === 0) return null;

    const handleSort = (columnId: string) => {
        setSortConfig(prev => ({ key: columnId, direction: (prev?.key === columnId && prev.direction === 'desc') ? 'asc' : 'desc' }));
    };
    
    const visibleColumns = columns.filter(c => c.isVisible).sort((a,b) => a.order - b.order);

    const groupedHeaders = useMemo(() => {
        const groups: { name: string; colSpan: number; }[] = [];
        if (visibleColumns.length === 0) return groups;
        
        let currentGroup = { name: visibleColumns[0].mainHeader, colSpan: 1 };
        for (let i = 1; i < visibleColumns.length; i++) {
            if (visibleColumns[i].mainHeader === currentGroup.name) {
                currentGroup.colSpan++;
            } else {
                groups.push(currentGroup);
                currentGroup = { name: visibleColumns[i].mainHeader, colSpan: 1 };
            }
        }
        groups.push(currentGroup);
        return groups;
    }, [visibleColumns]);
    
    const lastColumnIdsInGroup = useMemo(() => {
        const ids = new Set<string>();
        let count = 0;
        for (let i = 0; i < groupedHeaders.length; i++) {
            const group = groupedHeaders[i];
            count += group.colSpan;
            if (visibleColumns[count - 1]) {
                ids.add(visibleColumns[count - 1].id);
            }
        }
        return ids;
    }, [groupedHeaders, visibleColumns]);

    return (
        <>
            <div id="warehouse-summary-view" className="chart-card mb-6 rounded-none relative" ref={summaryRef}>
                {(isProcessing || isExporting) && <LoadingOverlay />}
                <div className="p-5 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shadow-sm border border-emerald-200 dark:border-emerald-800">
                            <Icon name="warehouse" size={6} className="text-emerald-600 dark:text-emerald-400"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Báo Cáo Doanh Thu Tổng Hợp</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">So sánh hiệu suất tổng quan giữa các kho</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 hide-on-export">
                        <button onClick={() => setIsSettingsModalOpen(true)} title="Tùy chỉnh cột" className="p-2 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-10 h-10 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Icon name="settings" />
                        </button>
                        <button onClick={handleSingleExport} disabled={isExporting} title="Xuất Ảnh Báo Cáo" className="p-2 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-10 h-10 border border-slate-200 dark:border-slate-700 shadow-sm">
                            {isExporting ? <Icon name="loader-2" className="animate-spin" /> : <Icon name="camera" />}
                        </button>
                        <button onClick={onBatchExport} disabled={isExporting || uniqueFilterOptions.kho.length <= 1} title="TỰ ĐỘNG XUẤT HÀNG LOẠT: App sẽ tự động lọc từng kho và lưu ảnh báo cáo tương ứng." className="p-2 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-center w-10 h-10 border border-indigo-200 dark:border-indigo-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            {isExporting ? <Icon name="loader-2" className="animate-spin" /> : <Icon name="images" />}
                        </button>
                    </div>
                </div>
                <div className="w-full">
                    <table className="w-full table-fixed text-sm">
                        <thead className="align-middle">
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th rowSpan={2} onClick={() => handleSort('khoName')} className="px-4 py-3 text-center uppercase text-sm font-bold cursor-pointer text-slate-700 dark:text-slate-200 shadow-md border-l-2 border-r-2 border-b-2 border-t-4 border-red-800">
                                    <div className="flex items-center justify-center gap-1.5"><span>KHO</span></div>
                                </th>
                                {groupedHeaders.map((group) => { 
                                    const colors = WAREHOUSE_HEADER_COLORS[group.name] || WAREHOUSE_HEADER_COLORS['DEFAULT']; 
                                    const borderClass = `border-r-2 ${colors.border}`; 
                                    return (
                                        <th key={group.name} colSpan={group.colSpan} className={`p-2 text-center text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 border-t-4 ${colors.border} ${borderClass} border-b-2 whitespace-normal`}>
                                            {group.name}
                                        </th>
                                    ); 
                                })}
                            </tr>
                            <tr className="bg-white/60 dark:bg-slate-800/60">
                                {visibleColumns.map((col) => { 
                                    const colors = WAREHOUSE_HEADER_COLORS[col.mainHeader] || WAREHOUSE_HEADER_COLORS['DEFAULT']; 
                                    const isLastInGroup = lastColumnIdsInGroup.has(col.id); 
                                    const borderClass = isLastInGroup ? `border-r-2 ${colors.border}` : `border-r ${colors.border}`; 
                                    const borderBottom = `border-b-2 ${colors.border}`; 
                                    return (
                                        <th key={col.id} onClick={() => handleSort(col.id)} className={`px-3 py-2 text-center text-xs font-bold uppercase tracking-wider cursor-pointer select-none transition-colors ${borderBottom} ${colors.sub} text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 ${borderClass}`}>
                                            <div className="flex items-center justify-center"><span>{col.subHeader}</span></div>
                                        </th>
                                    ); 
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {sortedData.map((row) => {
                                return (
                                <tr key={row.khoName} data-kho-id={row.khoName} className="hover:bg-sky-50 dark:hover:bg-sky-900/50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 text-center border-l-2 border-r-2 border-red-800">{row.khoName}</td>
                                    {visibleColumns.map((col) => {
                                        const value = (col.isCustom && col.productCodes) ? customProductColumnValues.get(col.id)?.get(row.khoName) : getColumnValue(row, col);
                                        const isHqqd = col.metric === 'hieuQuaQD';
                                        const isTraChamPercent = col.metric === 'traChamPercent';
                                        const colors = WAREHOUSE_HEADER_COLORS[col.mainHeader] || WAREHOUSE_HEADER_COLORS['DEFAULT'];
                                        const isLastInGroup = lastColumnIdsInGroup.has(col.id);
                                        const borderClass = isLastInGroup ? `border-r-2 ${colors.border}` : `border-r ${colors.border}`;
                                        const isRevenueColumn = col.metric === 'doanhThuThuc' || col.metric === 'doanhThuQD' || col.metricType === 'revenue' || col.metricType === 'revenueQD';
                                        
                                        let displayContent;
                                        if (isHqqd) {
                                            displayContent = <span className={getHqqdClass(value)}>{`${(value || 0).toFixed(0)}%`}</span>;
                                        } else if (isTraChamPercent) {
                                            displayContent = <span className={getTraChamPercentClass(value)}>{`${value !== undefined ? value.toFixed(0) : '0'}%`}</span>;
                                        } else if (isRevenueColumn) {
                                            const className = col.metric === 'doanhThuQD' || col.metricType === 'revenueQD' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300';
                                            displayContent = <span className={className}>{formatRevenueForKho(value)}</span>;
                                        } else {
                                            displayContent = <span className='text-slate-700 dark:text-slate-300'>{formatQuantityForKho(value)}</span>;
                                        }

                                        return (
                                            <td key={`${row.khoName}-${col.id}`} className={`px-4 py-3 text-center ${borderClass}`}>
                                                {displayContent}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )})}
                        </tbody>
                        <tfoot className="font-extrabold bg-sky-100 dark:bg-sky-900/50 text-sky-900 dark:text-sky-100 border-t-2 border-slate-300 dark:border-slate-600">
                             <tr className="border-t-2 border-slate-300 dark:border-slate-600">
                                <td className="px-4 py-3 text-center bg-inherit border-l-2 border-r-2 border-b-2 border-red-800">Tổng</td>
                                {visibleColumns.map((col) => {
                                    const isHqqd = col.metric === 'hieuQuaQD';
                                    const isTraChamPercent = col.metric === 'traChamPercent';
                                    const value = isHqqd ? (totals as any).hieuQuaQD : isTraChamPercent ? (totals as any).traChamPercent : customTotals.get(col.id);
                                    const colors = WAREHOUSE_HEADER_COLORS[col.mainHeader] || WAREHOUSE_HEADER_COLORS['DEFAULT'];
                                    const isLastInGroup = lastColumnIdsInGroup.has(col.id);
                                    const borderClass = isLastInGroup ? `border-r-2 ${colors.border}` : `border-r ${colors.border}`;
                                    const isRevenueColumn = col.metric === 'doanhThuThuc' || col.metric === 'doanhThuQD' || col.metricType === 'revenue' || col.metricType === 'revenueQD';

                                    let displayContent;
                                    if (isHqqd) {
                                        displayContent = <span className={getHqqdClass(value)}>{`${(value || 0).toFixed(0)}%`}</span>;
                                    } else if (isTraChamPercent) {
                                        displayContent = <span className={getTraChamPercentClass(value)}>{`${value !== undefined ? value.toFixed(0) : '0'}%`}</span>;
                                    } else if (isRevenueColumn) {
                                        const className = col.metric === 'doanhThuQD' || col.metricType === 'revenueQD' ? 'text-blue-700 dark:text-blue-300' : '';
                                        displayContent = <span className={className}>{formatRevenueForKho(value)}</span>;
                                    } else {
                                        displayContent = <span>{formatQuantityForKho(value)}</span>;
                                    }

                                    return (
                                        <td key={`total-${col.id}`} className={`px-4 py-3 text-center ${borderClass} border-b-2 ${colors.border}`}>
                                            {displayContent}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
             <WarehouseSettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={handleSaveColumns}
                columns={columns}
                allIndustries={allIndustries}
                allGroups={allGroups}
                allManufacturers={allManufacturers}
            />
        </>
    );
};

export default WarehouseSummary;
