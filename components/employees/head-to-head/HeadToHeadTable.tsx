import React, { useState } from 'react';
import type { DataRow, ProductConfig, Employee, HeadToHeadTableConfig } from '../../../types';
import { abbreviateName, formatQuantity, formatRevenueForHeadToHead, toLocalISOString } from '../../../utils/dataUtils';
import { Icon } from '../../common/Icon';
import { useHeadToHeadLogic } from '../../../hooks/useHeadToHeadLogic';
import { exportElementAsImage } from '../../../services/uiService';

interface HeadToHeadTableProps {
    config: HeadToHeadTableConfig;
    baseFilteredData: DataRow[];
    productConfig: ProductConfig;
    employeeData: Employee[];
    onAdd: () => void;
    onEdit: () => void;
    onDelete: () => void;
    getExportRef?: () => HTMLDivElement | null;
    tableColorTheme: { header: string; row: string; border: string; };
}

const HeadToHeadTable: React.FC<HeadToHeadTableProps> = ({ 
    config, 
    baseFilteredData, 
    productConfig, 
    employeeData, 
    onAdd, 
    onEdit, 
    onDelete, 
    tableColorTheme 
}) => {
    const [sortConfig, setSortConfig] = useState<{ key: string | number; direction: 'asc' | 'desc' }>({ key: 'daysWithNoSales', direction: 'asc' });
    const [includeToday, setIncludeToday] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const tableRef = React.useRef<HTMLDivElement>(null);

    const { header, border, row: oddRowColor } = tableColorTheme;

    // Use the new hook for data processing
    const { processedData, conditionalFormatData, departmentTotals } = useHeadToHeadLogic({
        config,
        baseFilteredData,
        productConfig,
        employeeData,
        sortConfig,
        includeToday
    });

    const handleSort = (key: string | number) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };
    
    const handleExport = async () => {
        if (tableRef.current) {
            setIsExporting(true);
            await exportElementAsImage(tableRef.current, `7-ngay-${config.tableName}.png`, {
                elementsToHide: ['.hide-on-export'],
                isCompactTable: true
            });
            setIsExporting(false);
        }
    };
    
    const formatValue = (value: number | undefined) => {
        if (value === undefined || value === null || !isFinite(value)) { return '-'; }
        if (config.totalCalculationMethod === 'average' && (config.metricType === 'revenue' || config.metricType === 'revenueQD')) {
            const roundedValue = Math.ceil(value / 1000000);
            return roundedValue.toLocaleString('vi-VN');
        }
        if (config.totalCalculationMethod === 'average' && config.metricType !== 'hieuQuaQD') {
            const roundedValue = Math.ceil(value);
            return formatQuantity(roundedValue);
        }
        if (config.metricType === 'revenue' || config.metricType === 'revenueQD') {
            return formatRevenueForHeadToHead(value);
        }
        if (config.metricType === 'hieuQuaQD') {
            if (value === 0) return '-';
            return `${value.toFixed(0)}%`;
        }
        return formatQuantity(value);
    };

    const getCellStyle = (value: number, row: any, dateKey: string): React.CSSProperties => {
        if (!config.conditionalFormats || value === 0) return {};
        let finalStyle: React.CSSProperties = {};

        for(const rule of config.conditionalFormats) {
            let targetValue: number;
            switch(rule.criteria) {
                case 'specific_value': targetValue = rule.value; break;
                case 'row_avg': targetValue = row.rowAverage; break;
                case 'column_dept_avg': targetValue = conditionalFormatData.deptAvgByDate.get(dateKey)?.get(row.department) ?? 0; break;
                default: continue;
            }

            let conditionMet = false;
            if (rule.operator === '>' && value > targetValue) conditionMet = true;
            if (rule.operator === '<' && value < targetValue) conditionMet = true;
            if (rule.operator === '=' && value === targetValue) conditionMet = true;

            if (conditionMet) {
                finalStyle.backgroundColor = rule.backgroundColor;
                finalStyle.color = rule.textColor;
            }
        }
        return finalStyle;
    };

    return (
        <div ref={tableRef}>
            <div className={`p-3 flex justify-between items-center ${header} border-b-2 ${border}`}>
                <h3 className="text-base font-bold uppercase text-center flex-grow flex items-center justify-center gap-2">
                    <Icon name="swords" size={4} />
                    <span>{config.tableName}</span>
                </h3>
                <div className="flex items-center gap-1 hide-on-export">
                    <button onClick={(e) => { e.stopPropagation(); onAdd(); }} title="Thêm Bảng Mới" className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors"><Icon name="plus-circle" size={4}/></button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Sửa Bảng" className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors"><Icon name="pencil" size={4}/></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Xóa Bảng" className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors"><Icon name="trash-2" size={4}/></button>
                    <button onClick={(e) => { e.stopPropagation(); handleExport(); }} disabled={isExporting} title="Xuất Ảnh" className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors">
                        {isExporting ? <Icon name="loader-2" size={4} className="animate-spin" /> : <Icon name="camera" size={4} />}
                    </button>
                </div>
            </div>

            <div className={`px-3 py-2 text-xs font-semibold flex justify-between items-center hide-on-export ${header.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
                <span>{processedData.dateRangeString}</span>
                 <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={includeToday} onChange={() => setIncludeToday(p => !p)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span>Bao gồm hôm nay</span>
                </label>
            </div>

            <div className="table-container">
                <table className="min-w-full text-sm compact-export-table">
                    <thead className={`${header} uppercase border-b ${border}`}>
                        <tr className="divide-x divide-slate-300 dark:divide-slate-600">
                            <th onClick={() => handleSort('name')} className="px-2 py-2 text-left font-bold cursor-pointer select-none bg-inherit w-40">
                                Nhân Viên
                            </th>
                            {processedData.dateHeaders.map(date => {
                                const dateKey = toLocalISOString(date);
                                return (
                                    <th key={date.toISOString()} onClick={() => handleSort(dateKey)} className="px-2 py-2 text-center font-bold cursor-pointer select-none">
                                        <div>
                                            {date.toLocaleDateString('vi-VN', { weekday: 'short' })}<br/>
                                            <span className="text-xs font-normal">{date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                                        </div>
                                    </th>
                                )
                            })}
                            <th onClick={() => handleSort('total')} className="px-2 py-2 text-center font-bold cursor-pointer select-none">
                                {config.totalCalculationMethod === 'average' ? 'TB' : 'TỔNG'}
                            </th>
                            <th onClick={() => handleSort('daysWithNoSales')} className="px-2 py-2 text-center font-bold cursor-pointer select-none">
                                NO<br/>SALE
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {processedData.sortedDepartments.map(department => {
                            const rows = processedData.groupedRows[department];
                            const deptTotalData = departmentTotals.get(department);
                            return(
                                <React.Fragment key={department}>
                                     <tr className={`border-t-2 ${border} ${oddRowColor}`}>
                                        <td colSpan={100} className={`px-4 py-2 text-sm font-bold bg-inherit ${header.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
                                            <div className="flex items-center gap-2">
                                                <Icon name="users-round" size={4} />
                                                <span>{department}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {rows.map((row, rowIndex) => {
                                        const rowClass = rowIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : oddRowColor;
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
                                                <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                     <div className="flex items-center gap-2">
                                                        {rankDisplay}
                                                        <span>{abbreviateName(row.name)}</span>
                                                    </div>
                                                </td>
                                                {processedData.dateHeaders.map(date => {
                                                    const dateKey = toLocalISOString(date);
                                                    const value = row.dailyValues[dateKey] || 0;
                                                    const cellStyle = getCellStyle(value, row, dateKey);
                                                    return (
                                                        <td key={dateKey} className="px-2 py-2 text-center font-medium" style={cellStyle}>
                                                            {formatValue(value)}
                                                        </td>
                                                    );
                                                })}
                                                <td className={`px-2 py-2 text-center font-bold text-blue-600 dark:text-blue-400`}>{formatValue(row.total)}</td>
                                                <td className={`px-2 py-2 text-center font-bold ${row.daysWithNoSales >= 4 ? 'text-red-500' : ''}`}>
                                                    {row.daysWithNoSales > 0 ? row.daysWithNoSales : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {deptTotalData && (
                                        <tr className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 divide-x divide-slate-200 dark:divide-slate-700">
                                            <td className="px-2 py-2 text-left bg-slate-100 dark:bg-slate-800">Tổng Nhóm</td>
                                            {processedData.dateHeaders.map(date => {
                                                const dateKey = toLocalISOString(date);
                                                return (
                                                    <td key={dateKey} className="px-2 py-2 text-center">
                                                        {formatValue(deptTotalData.daily.get(dateKey) || 0)}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-2 py-2 text-center">{formatValue(deptTotalData.total)}</td>
                                            <td className="px-2 py-2 text-center">
                                                {deptTotalData.daysWithNoSales > 0 ? deptTotalData.daysWithNoSales.toFixed(1) : '-'}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot className={`font-bold uppercase ${header}`}>
                        <tr className={`divide-x divide-slate-300 dark:divide-slate-600 border-t-2 ${border}`}>
                            <td className={`px-2 py-2 text-left bg-inherit`}>TỔNG CỘNG</td>
                            {processedData.dateHeaders.map(date => (
                                <td key={date.toISOString()} className="px-2 py-2 text-center">{formatValue(processedData.totals.daily.get(toLocalISOString(date)) || 0)}</td>
                            ))}
                            <td className="px-2 py-2 text-center">{formatValue(processedData.totals.total)}</td>
                            <td className="px-2 py-2 text-center">{processedData.totals.daysWithNoSales.toFixed(1)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default HeadToHeadTable;
