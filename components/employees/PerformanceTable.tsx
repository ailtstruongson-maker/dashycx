import React, { useMemo, useState, forwardRef, useEffect, useRef } from 'react';
import type { Employee, EmployeeData } from '../../types';
import { abbreviateName, formatCurrency, formatQuantity, formatQuantityWithFraction } from '../../utils/dataUtils';
import { Icon } from '../common/Icon';
import { getPerformanceTableAnalysis } from '../../services/aiService';
import { getThemeMap, saveThemeMap } from '../../services/dbService';
import { useDashboardContext } from '../../contexts/DashboardContext';

declare const lucide: any;

interface PerformanceTableProps {
    employeeData: EmployeeData;
    onEmployeeClick: (employeeName: string) => void;
    onExport?: () => void;
    isExporting?: boolean;
}

type SortKey = keyof Employee | 'name';
type SortDirection = 'asc' | 'desc';
type GroupType = 'doanhThu' | 'khaiThac';

const getTraChamPercentClass = (percentage: number) => {
    if (isNaN(percentage)) return 'text-slate-600 dark:text-slate-300';
    if (percentage >= 45) return 'text-green-500 font-bold';
    if (percentage >= 35) return 'text-amber-500 font-bold';
    return 'text-red-500 font-bold';
};

const colorThemes = [
    { name: 'emerald', header: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200', row: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-500' },
    { name: 'sky', header: 'bg-sky-100 dark:bg-sky-900/50 text-sky-900 dark:text-sky-200', row: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-sky-500' },
    { name: 'amber', header: 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200', row: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-500' },
    { name: 'rose', header: 'bg-rose-100 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200', row: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-500' },
    { name: 'indigo', header: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200', row: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-500' },
    { name: 'teal', header: 'bg-teal-100 dark:bg-teal-900/50 text-teal-900 dark:text-teal-200', row: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-teal-500' },
    { name: 'cyan', header: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-200', row: 'bg-cyan-50 dark:bg-cyan-900/30', border: 'border-cyan-500' },
    { name: 'fuchsia', header: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-900 dark:text-fuchsia-200', row: 'bg-fuchsia-50 dark:bg-fuchsia-900/30', border: 'border-fuchsia-500' },
    { name: 'lime', header: 'bg-lime-100 dark:bg-lime-900/50 text-lime-900 dark:text-lime-200', row: 'bg-lime-50 dark:bg-lime-900/30', border: 'border-lime-500' },
    { name: 'purple', header: 'bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200', row: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-500' },
];

const PerformanceTable = forwardRef<HTMLDivElement, PerformanceTableProps>(({ employeeData, onEmployeeClick, onExport, isExporting }, ref) => {
    const { handleExport } = useDashboardContext();
    const { fullSellerArray } = employeeData;
    const [sortConfigDoanhThu, setSortConfigDoanhThu] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'hieuQuaValue', direction: 'desc' });
    const [sortConfigKhaiThac, setSortConfigKhaiThac] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'traChamPercent_CE_ICT', direction: 'desc' });
    
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    
    const doanhThuTableRef = useRef<HTMLDivElement>(null);
    const khaiThacTableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref && typeof ref !== 'function' && ref.current && typeof lucide !== 'undefined') {
            const timer = setTimeout(() => {
                lucide.createIcons({ root: ref.current });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [employeeData, ref]);
    
    const handleAiAnalysis = async () => {
        setIsAnalysisLoading(true);
        setAnalysis(null);
        try {
            const result = await getPerformanceTableAnalysis(employeeData);
            setAnalysis(result);
        } catch (error) {
            console.error("Lỗi khi phân tích bảng hiệu suất:", error);
            setAnalysis("Đã xảy ra lỗi khi phân tích. Vui lòng thử lại.");
        } finally { setIsAnalysisLoading(false); }
    };
    
    const { groupedData, groupTotals, grandTotal } = useMemo(() => {
        const employeesWithSales = fullSellerArray.filter(s => s.doanhThuThuc > 0);

        const calculateTotals = (items: Employee[]) => {
            const initialTotals = {
                doanhThuThuc: 0, doanhThuQD: 0, slTiepCan: 0, slTraCham: 0, doanhThuTraCham: 0,
                slCE_ICT: 0, slTraCham_CE_ICT: 0, doanhThu_CE_ICT: 0, doanhThuTraCham_CE_ICT: 0,
                weakPointsRevenue: 0, weakPointsExploitation: 0,
            };
            if (items.length === 0) return { ...initialTotals, hieuQuaValue: 0, traChamPercent: 0, traChamPercent_CE_ICT: 0, dtTraChamPercent_CE_ICT: 0 };
            
            const t = items.reduce((acc, d) => {
                // FIX: Correctly typed the 'key' to be a key of both 'initialTotals' and 'Employee' to ensure type-safe property access.
                // By casting Object.keys, `key` becomes a strongly-typed key of initialTotals.
                for (const key of Object.keys(initialTotals) as (keyof typeof initialTotals)[]) {
                    // The keys in `initialTotals` are a subset of keys in `Employee`, so this is safe.
                    const value = d[key as keyof Employee];
                    if (typeof value === 'number') {
                        acc[key] += value;
                    }
                }
                return acc;
            }, { ...initialTotals });

            return { ...t, 
                hieuQuaValue: t.doanhThuThuc > 0 ? ((t.doanhThuQD - t.doanhThuThuc) / t.doanhThuThuc) * 100 : 0,
                traChamPercent: t.doanhThuThuc > 0 ? (t.doanhThuTraCham / t.doanhThuThuc) * 100 : 0,
                traChamPercent_CE_ICT: t.slCE_ICT > 0 ? (t.slTraCham_CE_ICT / t.slCE_ICT) * 100 : 0,
                dtTraChamPercent_CE_ICT: t.doanhThu_CE_ICT > 0 ? (t.doanhThuTraCham_CE_ICT / t.doanhThu_CE_ICT) * 100 : 0,
            };
        };

        const grouped = employeesWithSales.reduce((acc, employee) => {
            const dept = employee.department || 'Không Phân Ca';
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(employee);
            return acc;
        }, {} as { [key: string]: Employee[] });
        
        const groupTotals: { [key: string]: any } = {};
        for (const dept in grouped) { groupTotals[dept] = calculateTotals(grouped[dept]); }
        const grandTotal = calculateTotals(employeesWithSales);
        
        const sortedGroupKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
        const finalGroupedData: { [key: string]: Employee[] } = {};
        sortedGroupKeys.forEach(key => { finalGroupedData[key] = grouped[key]; });

        return { groupedData: finalGroupedData, groupTotals, grandTotal };
    }, [fullSellerArray]);

    const handleSort = (groupType: GroupType, key: SortKey) => {
        const setSort = groupType === 'doanhThu' ? setSortConfigDoanhThu : setSortConfigKhaiThac;
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };
    
    const handleSingleExport = async (groupType: GroupType) => {
        const refToUse = groupType === 'doanhThu' ? doanhThuTableRef : khaiThacTableRef;
        if (refToUse.current) {
            await handleExport(refToUse.current, `hieu-qua-${groupType}.png`, { isCompactTable: true });
        }
    };
    
    const handleBatchExportClick = async () => {
        if (doanhThuTableRef.current) {
            await handleExport(doanhThuTableRef.current, 'hieu-qua-doanh-thu-qd.png', { isCompactTable: true });
            await new Promise(res => setTimeout(res, 300));
        }
        if (khaiThacTableRef.current) {
            await handleExport(khaiThacTableRef.current, 'hieu-qua-khai-thac-tra-cham.png', { isCompactTable: true });
        }
    };

    const SinglePerformanceTable: React.FC<{
        groupType: GroupType;
        sortConfig: { key: SortKey; direction: SortDirection };
        onSort: (key: SortKey) => void;
        tableRef: React.RefObject<HTMLDivElement>;
        onSingleExport: () => void;
    }> = ({ groupType, sortConfig, onSort, tableRef, onSingleExport }) => {
        const themeIndex = groupType === 'doanhThu' ? 0 : 1;
        const tableColorTheme = colorThemes[themeIndex % colorThemes.length];
        
        const isDoanhThu = groupType === 'doanhThu';
        const title = isDoanhThu ? 'HIỆU QUẢ DOANH THU QĐ' : 'HIỆU QUẢ KHAI THÁC TRẢ CHẬM/CE+ICT';
        const icon = isDoanhThu ? 'dollar-sign' : 'recycle';
        
        const headers: { label: string, key: SortKey }[] = isDoanhThu
            ? [
                { label: 'Thực', key: 'doanhThuThuc' }, { label: 'DTQĐ', key: 'doanhThuQD' },
                { label: 'HQQĐ', key: 'hieuQuaValue' }, { label: '%T.CHẬM', key: 'dtTraChamPercent_CE_ICT' },
                { label: '#YẾU', key: 'weakPointsRevenue' }
              ]
            : [
                { label: 'T.Cận', key: 'slTiepCan' }, { label: 'CE/ICT', key: 'slCE_ICT' },
                { label: 'T.CHẬM', key: 'slTraCham_CE_ICT' }, { label: '%T.CHẬM', key: 'traChamPercent_CE_ICT' },
                { label: '#YẾU', key: 'weakPointsExploitation' }
              ];

        const renderHeader = (label: string, sortKey: SortKey) => (
            <th onClick={() => onSort(sortKey)} className="px-2 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer text-center">
                {label}
            </th>
        );

        const showDeptHeaders = Object.keys(groupedData).length > 1 || (Object.keys(groupedData).length === 1 && Object.keys(groupedData)[0] !== 'Không Phân Ca');
        const medals = ['🥇', '🥈', '🥉'];

        return (
            <div ref={tableRef} className={`border rounded-lg ${tableColorTheme.border} overflow-hidden`}>
                <div className={`p-4 ${tableColorTheme.header} border-b-2 ${tableColorTheme.border} relative text-center`}>
                    <h3 className="text-lg font-bold flex items-center justify-center gap-2">
                        <Icon name={icon} size={5} /> <span>{title}</span>
                    </h3>
                    <div className="hide-on-export absolute top-1/2 right-4 -translate-y-1/2">
                        <button onClick={onSingleExport} disabled={isExporting} title="Xuất Ảnh Bảng Này" className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors">
                             <Icon name="camera" size={4} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto table-container">
                    <table className="min-w-full compact-export-table">
                        <thead className={tableColorTheme.header}>
                            <tr className="divide-x divide-current/20">
                                <th onClick={() => onSort('name')} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer bg-inherit align-middle w-40">
                                    Nhân Viên
                                </th>
                                {headers.map(h => renderHeader(h.label, h.key))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedData).map(([dept, employees]: [string, Employee[]]) => {
                                const sortedEmployees = [...employees].sort((a, b) => {
                                    const valA = a[sortConfig.key]; const valB = b[sortConfig.key];
                                    if (typeof valA === 'number' && typeof valB === 'number') {
                                        // FIX: Corrected sorting logic for descending order.
                                        const result = sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                                        if (result !== 0) return result;
                                    }
                                    return a.name.localeCompare(b.name);
                                });
                                
                                return (
                                <React.Fragment key={dept}>
                                    {showDeptHeaders && (
                                        <tr className={`${tableColorTheme.row} border-t-2 ${tableColorTheme.border}`}>
                                            <td colSpan={1 + headers.length} className="px-4 py-2 text-sm font-bold">
                                                <div className="flex items-center gap-2"><Icon name="users-round" size={4} /><span>{dept}</span></div>
                                            </td>
                                        </tr>
                                    )}
                                    {sortedEmployees.map((employee, index) => {
                                        const rankIndex = index;
                                        const medal = rankIndex < 3 ? medals[rankIndex] : null;
                                        let rankDisplay;
                                        if (medal) {
                                            rankDisplay = <div className="w-8 text-2xl font-bold text-center">{medal}</div>;
                                        } else {
                                            rankDisplay = <div className="w-8 text-sm text-slate-500 dark:text-slate-400 font-semibold text-center">#{rankIndex + 1}</div>
                                        }

                                        const rowClass = index % 2 === 0 ? 'bg-white dark:bg-slate-800/50' : tableColorTheme.row;
                                        
                                        return (
                                        <tr key={employee.name} className={`${rowClass} hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors divide-x divide-slate-200 dark:divide-slate-700`}>
                                            <td className="px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {rankDisplay}
                                                    <span onClick={() => onEmployeeClick(employee.name)} className="cursor-pointer hover:underline truncate" title={employee.name}>
                                                        {abbreviateName(employee.name)}
                                                    </span>
                                                </div>
                                            </td>
                                            {headers.map(h => (
                                                <td key={h.key} className="px-2 py-2 text-center text-sm text-slate-600 dark:text-slate-300">
                                                    { h.key === 'doanhThuThuc' && formatCurrency(employee.doanhThuThuc) }
                                                    { h.key === 'doanhThuQD' && <span className="font-bold text-green-700 dark:text-green-500">{formatCurrency(employee.doanhThuQD)}</span> }
                                                    { h.key === 'hieuQuaValue' && <span className={employee.hieuQuaValue < 35 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>{employee.hieuQuaValue.toFixed(0)}%</span> }
                                                    { h.key === 'dtTraChamPercent_CE_ICT' && <span className={getTraChamPercentClass(employee.dtTraChamPercent_CE_ICT)}>{employee.dtTraChamPercent_CE_ICT.toFixed(0)}%</span> }
                                                    { h.key === 'weakPointsRevenue' && <span className={`font-bold ${employee.weakPointsRevenue > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{employee.weakPointsRevenue > 0 ? employee.weakPointsRevenue : '-'}</span> }
                                                    { h.key === 'slTiepCan' && formatQuantity(employee.slTiepCan) }
                                                    { h.key === 'slCE_ICT' && formatQuantity(employee.slCE_ICT) }
                                                    { h.key === 'slTraCham_CE_ICT' && formatQuantity(employee.slTraCham_CE_ICT) }
                                                    { h.key === 'traChamPercent_CE_ICT' && <span className={getTraChamPercentClass(employee.traChamPercent_CE_ICT)}>{employee.traChamPercent_CE_ICT.toFixed(0)}%</span> }
                                                    { h.key === 'weakPointsExploitation' && <span className={`font-bold ${employee.weakPointsExploitation > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{employee.weakPointsExploitation > 0 ? employee.weakPointsExploitation : '-'}</span> }
                                                </td>
                                            ))}
                                        </tr>
                                    )})}
                                </React.Fragment>
                            )})}
                        </tbody>
                        <tfoot className="font-extrabold uppercase">
                             <tr className={tableColorTheme.header}>
                                <td className={`px-4 py-3 text-sm border-t-2 ${tableColorTheme.border}`}>Tổng cộng</td>
                                {headers.map(h => (
                                    <td key={h.key} className={`px-2 py-3 text-sm text-center border-t-2 ${tableColorTheme.border}`}>
                                        { h.key === 'doanhThuThuc' && formatCurrency(grandTotal.doanhThuThuc) }
                                        { h.key === 'doanhThuQD' && <span className="font-bold text-green-700 dark:text-green-500">{formatCurrency(grandTotal.doanhThuQD)}</span> }
                                        { h.key === 'hieuQuaValue' && <span className={grandTotal.hieuQuaValue < 35 ? 'text-red-600' : 'text-green-600'}>{grandTotal.hieuQuaValue.toFixed(0)}%</span> }
                                        { h.key === 'dtTraChamPercent_CE_ICT' && <span className={getTraChamPercentClass(grandTotal.dtTraChamPercent_CE_ICT)}>{grandTotal.dtTraChamPercent_CE_ICT.toFixed(0)}%</span> }
                                        { h.key === 'weakPointsRevenue' && formatQuantity(grandTotal.weakPointsRevenue) }
                                        { h.key === 'slTiepCan' && formatQuantity(grandTotal.slTiepCan) }
                                        { h.key === 'slCE_ICT' && formatQuantity(grandTotal.slCE_ICT) }
                                        { h.key === 'slTraCham_CE_ICT' && formatQuantity(grandTotal.slTraCham_CE_ICT) }
                                        { h.key === 'traChamPercent_CE_ICT' && <span className={getTraChamPercentClass(grandTotal.traChamPercent_CE_ICT)}>{grandTotal.traChamPercent_CE_ICT.toFixed(0)}%</span> }
                                        { h.key === 'weakPointsExploitation' && formatQuantity(grandTotal.weakPointsExploitation) }
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div ref={ref}>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Bảng Hiệu Suất Toàn Diện</h3>
                 <div className="flex items-center gap-2 hide-on-export">
                    <button onClick={handleAiAnalysis} disabled={isAnalysisLoading} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors" title="Nhận xét tổng quan bằng AI">
                        {isAnalysisLoading ? <Icon name="loader-2" size={4} className="animate-spin" /> : <Icon name="sparkles" size={4} />}
                    </button>
                    {onExport && (
                        <button onClick={handleBatchExportClick} disabled={isExporting} title="Xuất Hàng Loạt Ảnh" className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors">
                            {isExporting ? <Icon name="loader-2" size={4} className="animate-spin" /> : <Icon name="images" size={4} />}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SinglePerformanceTable
                    groupType="doanhThu"
                    sortConfig={sortConfigDoanhThu}
                    onSort={(key) => handleSort('doanhThu', key)}
                    tableRef={doanhThuTableRef}
                    onSingleExport={() => handleSingleExport('doanhThu')}
                />
                <SinglePerformanceTable
                    groupType="khaiThac"
                    sortConfig={sortConfigKhaiThac}
                    onSort={(key) => handleSort('khaiThac', key)}
                    tableRef={khaiThacTableRef}
                    onSingleExport={() => handleSingleExport('khaiThac')}
                />
            </div>

            {(analysis || isAnalysisLoading) && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-slate-900/50 border border-green-200 dark:border-green-900/50 rounded-lg">
                    <h4 className="font-bold text-green-800 dark:text-green-200 flex items-center gap-2">
                        <Icon name="sparkles" /> AI Phân Tích Bảng
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

export default PerformanceTable;