
import React, { useMemo, useState, forwardRef, useEffect, useRef } from 'react';
import { formatCurrency, abbreviateName, formatQuantityWithFraction, formatQuantity } from '../../utils/dataUtils';
import { Icon } from '../common/Icon';
import type { ExploitationData } from '../../types';
import { getIndustryAnalysis } from '../../services/aiService';
import { getThemeMap, saveThemeMap, getIndustryVisibleGroups, saveIndustryVisibleGroups } from '../../services/dbService';


interface IndustryAnalysisTabProps {
    data: ExploitationData[];
    onExport?: () => void;
    isExporting?: boolean;
    onBatchExport: (data: ExploitationData[]) => void;
}

type SortConfig = {
    key: keyof ExploitationData | 'name' | 'percentBaoHiem' | 'percentSimKT' | 'percentDongHoKT' | 'percentPhuKienKT' | 'percentGiaDungKT' | 'belowAverageCount' | 'slSPChinh_Tong';
    direction: 'asc' | 'desc';
};

const HeaderCell: React.FC<{
    label: string | React.ReactNode;
    sortKey: SortConfig['key'];
    className?: string;
    onSort: (key: SortConfig['key']) => void;
    sortConfig: SortConfig;
}> = ({ label, sortKey, onSort, sortConfig, className }) => {
    const isActive = sortConfig.key === sortKey;
    const headerColor = 'purple';
    return (
        <th
            onClick={() => onSort(sortKey)}
            className={`px-2 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer select-none ${isActive ? `text-${headerColor}-900 dark:text-${headerColor}-100` : 'text-inherit/80'} hover:text-${headerColor}-900 dark:hover:text-${headerColor}-100 ${className || ''}`}
        >
            {label}
        </th>
    );
};

const detailQuickFilters: { key: string; label: string }[] = [
    { key: 'doanhThu', label: 'Doanh Thu' },
    { key: 'spChinh', label: 'SP Chính' },
    { key: 'baoHiem', label: 'Bảo Hiểm' },
    { key: 'sim', label: 'SIM' },
    { key: 'dongHo', label: 'Đồng Hồ' },
    { key: 'phuKien', label: 'Phụ Kiện' },
    { key: 'giaDung', label: 'Gia Dụng' },
];

const groupToSortKeyMap: Record<string, SortConfig['key']> = {
    baoHiem: 'percentBaoHiem',
    sim: 'percentSimKT',
    dongHo: 'percentDongHoKT',
    phuKien: 'percentPhuKienKT',
    giaDung: 'percentGiaDungKT',
};

// Data structure for detail view headers
const detailHeaderGroups: Record<string, { label: string; colSpan: number; subHeaders: { label: string; key: SortConfig['key'] }[] }> = {
    doanhThu: { label: 'DOANH THU', colSpan: 3, subHeaders: [
        { label: 'DT Thực', key: 'doanhThuThuc' },
        { label: 'DTQĐ', key: 'doanhThuQD' },
        { label: 'HQQĐ', key: 'hieuQuaQD' }
    ]},
    spChinh: { label: 'SP CHÍNH', colSpan: 4, subHeaders: [
        { label: 'ICT', key: 'slICT' },
        { label: 'CE', key: 'slCE_main' },
        { label: 'ĐGD', key: 'slGiaDung_main' },
        { label: 'Tổng', key: 'slSPChinh_Tong' }
    ]},
    baoHiem: { label: 'BẢO HIỂM', colSpan: 3, subHeaders: [
        { label: 'SL', key: 'slBaoHiem' },
        { label: 'Doanh thu', key: 'doanhThuBaoHiem' },
        { label: '%', key: 'percentBaoHiem' }
    ]},
    sim: { label: 'SIM', colSpan: 3, subHeaders: [
        { label: 'SL', key: 'slSim' },
        { label: 'Doanh thu', key: 'doanhThuSim' },
        { label: '%', key: 'percentSimKT' }
    ]},
    dongHo: { label: 'ĐỒNG HỒ', colSpan: 3, subHeaders: [
        { label: 'SL', key: 'slDongHo' },
        { label: 'Doanh thu', key: 'doanhThuDongHo' },
        { label: '%', key: 'percentDongHoKT' }
    ]},
    phuKien: { label: 'PHỤ KIỆN', colSpan: 6, subHeaders: [
        { label: 'SL Cam', key: 'slCamera' },
        { label: 'SL Loa', key: 'slLoa' },
        { label: 'SL Pin', key: 'slPinSDP' },
        { label: 'SL T.Nghe', key: 'slTaiNgheBLT' },
        { label: 'D.Thu', key: 'doanhThuPhuKien' },
        { label: '%', key: 'percentPhuKienKT' }
    ]},
    giaDung: { label: 'GIA DỤNG', colSpan: 6, subHeaders: [
        { label: 'SL MLN', key: 'slMayLocNuoc' },
        { label: 'SL N.Cơm', key: 'slNoiCom' },
        { label: 'SL N.Chiên', key: 'slNoiChien' },
        { label: 'SL Quạt', key: 'slQuatDien' },
        { label: 'D.Thu', key: 'doanhThuGiaDung' },
        { label: '%', key: 'percentGiaDungKT' }
    ]}
};

const colorThemes = [
    { header: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200', row: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-500' },
    { header: 'bg-sky-100 dark:bg-sky-900/50 text-sky-900 dark:text-sky-200', row: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-sky-500' },
    { header: 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200', row: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-500' },
    { header: 'bg-rose-100 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200', row: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-500' },
    { header: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200', row: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-500' },
    { header: 'bg-teal-100 dark:bg-teal-900/50 text-teal-900 dark:text-teal-200', row: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-teal-500' },
    { header: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-200', row: 'bg-cyan-50 dark:bg-cyan-900/30', border: 'border-cyan-500' },
    { header: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-900 dark:text-fuchsia-200', row: 'bg-fuchsia-50 dark:bg-fuchsia-900/30', border: 'border-fuchsia-500' },
    { header: 'bg-lime-100 dark:bg-lime-900/50 text-lime-900 dark:text-lime-200', row: 'bg-lime-50 dark:bg-lime-900/30', border: 'border-lime-500' },
    { header: 'bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200', row: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-500' },
];

const IndustryAnalysisTab = forwardRef<HTMLDivElement, IndustryAnalysisTabProps>(({ data, onExport, isExporting, onBatchExport }, ref) => {
    const [viewMode, setViewMode] = useState<'detail' | 'efficiency' | 'efficiency_dt_sl' | 'efficiency_quantity'>('detail');
    const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());
    const [initialGroupsLoaded, setInitialGroupsLoaded] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'percentBaoHiem', direction: 'desc' });
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    
    const themeMapRef = useRef<Record<string, number>>({});
    const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

    useEffect(() => {
        getIndustryVisibleGroups().then(savedGroups => {
            if (savedGroups && savedGroups.length > 0) {
                setVisibleGroups(new Set(savedGroups));
            } else {
                setVisibleGroups(new Set(['spChinh', 'baoHiem']));
            }
            setInitialGroupsLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (initialGroupsLoaded) {
            // FIX: Cast the array from the Set to string[] to satisfy the function signature.
            saveIndustryVisibleGroups(Array.from(visibleGroups) as string[]);
        }
    }, [visibleGroups, initialGroupsLoaded]);

    useEffect(() => {
        const loadTheme = async () => {
            const savedMap = await getThemeMap('industry');
            if (savedMap) themeMapRef.current = savedMap;
            const initialGroup = Array.from(visibleGroups)[0] || 'doanhThu';
            if (savedMap && savedMap[initialGroup as string]) {
                setCurrentThemeIndex(savedMap[initialGroup as string]);
            } else {
                setCurrentThemeIndex(Math.floor(Math.random() * colorThemes.length));
            }
        };
        if(initialGroupsLoaded) loadTheme();
    }, [initialGroupsLoaded, visibleGroups]);
    
    useEffect(() => {
        if (viewMode === 'efficiency' || viewMode === 'efficiency_dt_sl' || viewMode === 'efficiency_quantity') {
            setSortConfig({ key: 'slSPChinh_Tong', direction: 'desc' });
        } else {
            setSortConfig({ key: 'percentBaoHiem', direction: 'desc' });
        }
    }, [viewMode]);
    
    const handleToggleGroup = (groupKey: string) => {
        const newVisibleGroups = new Set(visibleGroups);
        const wasAdded = !newVisibleGroups.has(groupKey);

        if (wasAdded) {
            newVisibleGroups.add(groupKey);
        } else {
            if (newVisibleGroups.size > 1) { 
                newVisibleGroups.delete(groupKey);
            }
        }
        
        const setsAreEqual = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(value => b.has(value));

        if (!setsAreEqual(visibleGroups as Set<string>, newVisibleGroups as Set<string>)) {
            setVisibleGroups(newVisibleGroups);

            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * colorThemes.length);
            } while (newIndex === currentThemeIndex && colorThemes.length > 1);
            setCurrentThemeIndex(newIndex);
            
            themeMapRef.current[groupKey] = newIndex;
            saveThemeMap('industry', { ...themeMapRef.current });

            const sortKeyForToggledGroup = groupToSortKeyMap[groupKey];
            if (wasAdded && sortKeyForToggledGroup) {
                setSortConfig({ key: sortKeyForToggledGroup, direction: 'desc' });
            } else if (!wasAdded && sortConfig.key === sortKeyForToggledGroup) {
                const remainingSpecialGroups: string[] = detailQuickFilters.map(f => f.key).filter((key) => newVisibleGroups.has(key) && groupToSortKeyMap[key]);
                if (remainingSpecialGroups.length > 0) {
                    const firstKey = remainingSpecialGroups[0];
                    const newSortKey = groupToSortKeyMap[firstKey];
                    if(newSortKey) setSortConfig({ key: newSortKey, direction: 'desc' });
                } else {
                    if (viewMode !== 'detail') {
                        setSortConfig({ key: 'slSPChinh_Tong', direction: 'desc' });
                    } else {
                        setSortConfig({ key: 'percentBaoHiem', direction: 'desc' });
                    }
                }
            }
        }
    };

    const handleAiAnalysis = async () => {
        setIsAnalysisLoading(true);
        setAnalysis(null);
        try {
            const result = await getIndustryAnalysis(data);
            setAnalysis(result);
        } catch (error) {
            console.error("Lỗi khi phân tích khai thác:", error);
            setAnalysis("Đã xảy ra lỗi khi phân tích. Vui lòng thử lại.");
        } finally {
            setIsAnalysisLoading(false);
        }
    };
    
    const tableColorTheme = colorThemes[currentThemeIndex] || colorThemes[0];

    const { processedData, groupTotals, grandTotal } = useMemo(() => {
        const thresholds = { percentBaoHiem: 40, percentSimKT: 30, percentDongHoKT: 20, percentPhuKienKT: 10, percentGiaDungKT: 30 };

        const enhancedData = data.map(item => {
            const slSPChinh_Tong = (item.slICT || 0) + (item.slCE_main || 0) + (item.slGiaDung_main || 0);
            const percentBaoHiem = slSPChinh_Tong > 0 ? ((item.slBaoHiem || 0) / slSPChinh_Tong) * 100 : 0;
            const percentSimKT = (item.slICT || 0) > 0 ? ((item.slSim || 0) / (item.slICT || 1)) * 100 : 0;
            const percentDongHoKT = slSPChinh_Tong > 0 ? ((item.slDongHo || 0) / slSPChinh_Tong) * 100 : 0;
            const percentPhuKienKT = (item.doanhThuICT || 0) > 0 ? ((item.doanhThuPhuKien || 0) / (item.doanhThuICT || 1)) * 100 : 0;
            const percentGiaDungKT = (item.doanhThuCE_main || 0) > 0 ? ((item.doanhThuGiaDung || 0) / (item.doanhThuCE_main || 1)) * 100 : 0;

            let belowAverageCount = 0;
            if (percentBaoHiem < thresholds.percentBaoHiem) belowAverageCount++;
            if (percentSimKT < thresholds.percentSimKT) belowAverageCount++;
            if (percentDongHoKT < thresholds.percentDongHoKT) belowAverageCount++;
            if (percentPhuKienKT < thresholds.percentPhuKienKT) belowAverageCount++;
            if (percentGiaDungKT < thresholds.percentGiaDungKT) belowAverageCount++;

            return { ...item, slSPChinh_Tong, percentBaoHiem, percentSimKT, percentDongHoKT, percentPhuKienKT, percentGiaDungKT, belowAverageCount };
        });

        const sorted = [...enhancedData].sort((a, b) => {
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            
            // Explicitly cast the key to ensure it matches properties of 'a' and 'b'
            const key = sortConfig.key as keyof typeof a;
            
            // Safe access using the key
            const valA = a[key] ?? 0;
            const valB = b[key] ?? 0;

            if (typeof valA === 'number' && typeof valB === 'number') {
                const result = sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                if (result !== 0) return result;
            }
            return a.name.localeCompare(b.name);
        });

        const grouped = sorted.reduce((acc, employee) => {
            const dept = employee.department || 'Không Phân Ca';
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(employee);
            return acc;
        }, {} as { [key: string]: typeof sorted });
        
        const sortedGroupKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
        const finalGroupedData: { [key: string]: typeof sorted } = {};
        sortedGroupKeys.forEach(key => { finalGroupedData[key] = grouped[key]; });

        const calculateTotals = (items: typeof enhancedData) => {
             const initialTotals = {
                doanhThuThuc: 0, doanhThuQD: 0,
                slICT: 0, doanhThuICT: 0, slCE_main: 0, doanhThuCE_main: 0, slGiaDung_main: 0,
                slBaoHiem: 0, doanhThuBaoHiem: 0,
                slSim: 0, doanhThuSim: 0, slDongHo: 0, doanhThuDongHo: 0,
                doanhThuPhuKien: 0, slPhuKien: 0, slCamera: 0, slLoa: 0, slPinSDP: 0, slTaiNgheBLT: 0,
                doanhThuGiaDung: 0, slGiaDung: 0, slMayLocNuoc: 0, slNoiCom: 0, slNoiChien: 0, slQuatDien: 0,
                belowAverageCount: 0
            };

            if (items.length === 0) return { ...initialTotals, hieuQuaQD: 0, percentBaoHiem: 0, percentSimKT: 0, percentDongHoKT: 0, percentPhuKienKT: 0, percentGiaDungKT: 0, slSPChinh_Tong: 0 };
            
            const t = items.reduce((acc, item) => {
                const keys = Object.keys(initialTotals) as Array<keyof typeof initialTotals>;
                keys.forEach((key) => {
                    const value = (item as any)[key];
                    if (typeof value === 'number') {
                        (acc as any)[key] += value;
                    }
                });
                return acc;
            }, { ...initialTotals });
            
            const hieuQuaQD = t.doanhThuThuc > 0 ? (t.doanhThuQD - t.doanhThuThuc) / t.doanhThuThuc * 100 : 0;
            const slSPChinh_Tong = t.slICT + t.slCE_main + t.slGiaDung_main;
            const percentBaoHiem = slSPChinh_Tong > 0 ? (t.slBaoHiem / slSPChinh_Tong) * 100 : 0;
            const percentSimKT = t.slICT > 0 ? (t.slSim / t.slICT) * 100 : 0;
            const percentDongHoKT = slSPChinh_Tong > 0 ? (t.slDongHo / slSPChinh_Tong) * 100 : 0;
            const percentPhuKienKT = t.doanhThuICT > 0 ? (t.doanhThuPhuKien / t.doanhThuICT) * 100 : 0;
            const percentGiaDungKT = t.doanhThuCE_main > 0 ? (t.doanhThuGiaDung / t.doanhThuCE_main) * 100 : 0;
            
            return { ...t, slSPChinh_Tong, hieuQuaQD, percentBaoHiem, percentSimKT, percentDongHoKT, percentPhuKienKT, percentGiaDungKT };
        };

        const groupTotals: { [key: string]: any } = {};
        for (const dept in finalGroupedData) { groupTotals[dept] = calculateTotals(finalGroupedData[dept]); }
        const grandTotal = calculateTotals(enhancedData);

        return { processedData: finalGroupedData, groupTotals, grandTotal };
    }, [data, sortConfig]);

    const handleSort = (key: SortConfig['key']) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') { direction = 'asc'; }
        setSortConfig({ key, direction });
    };
    
    const showDeptHeaders = Object.keys(processedData).length > 1 || (Object.keys(processedData).length === 1 && Object.keys(processedData)[0] !== 'Không Phân Ca');
    
    const formatPct = (value: number) => value > 0 ? `${value.toFixed(0)}%` : '-';
    const formatNum = (value: number) => value > 0 ? formatQuantityWithFraction(value) : '-';
    const formatC = (value: number) => value > 0 ? formatCurrency(value) : '-';
    const boldBlueText = 'font-bold text-blue-600 dark:text-blue-400';
    const warningText = 'text-red-700 dark:text-red-500 font-bold';
    
    const renderDetailModeCells = (rowData: any) => (
        <>
            {visibleGroups.has('doanhThu') && <>
                <td className="px-2 py-3 text-center text-sm">{formatC(rowData.doanhThuThuc)}</td>
                <td className="px-2 py-3 text-center text-sm font-semibold">{formatC(rowData.doanhThuQD)}</td>
                <td className={`px-2 py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400`}>{formatPct(rowData.hieuQuaQD)}</td>
            </>}
            {visibleGroups.has('spChinh') && <>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slICT)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slCE_main)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slGiaDung_main)}</td>
                <td className={`px-2 py-3 text-center text-sm font-semibold`}>{formatNum(rowData.slSPChinh_Tong)}</td>
            </>}
            {visibleGroups.has('baoHiem') && <>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slBaoHiem)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatC(rowData.doanhThuBaoHiem)}</td>
                <td className={`px-2 py-3 text-center text-sm ${rowData.percentBaoHiem < 40 ? warningText : boldBlueText}`}>{formatPct(rowData.percentBaoHiem)}</td>
            </>}
            {visibleGroups.has('sim') && <>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slSim)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatC(rowData.doanhThuSim)}</td>
                <td className={`px-2 py-3 text-center text-sm ${rowData.percentSimKT < 30 ? warningText : boldBlueText}`}>{formatPct(rowData.percentSimKT)}</td>
            </>}
            {visibleGroups.has('dongHo') && <>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slDongHo)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatC(rowData.doanhThuDongHo)}</td>
                <td className={`px-2 py-3 text-center text-sm ${rowData.percentDongHoKT < 20 ? warningText : boldBlueText}`}>{formatPct(rowData.percentDongHoKT)}</td>
            </>}
            {visibleGroups.has('phuKien') && <>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slCamera)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slLoa)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slPinSDP)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slTaiNgheBLT)}</td>
                <td className="px-2 py-3 text-center text-sm font-semibold">{formatC(rowData.doanhThuPhuKien)}</td>
                <td className={`px-2 py-3 text-center text-sm ${rowData.percentPhuKienKT < 10 ? warningText : boldBlueText}`}>{formatPct(rowData.percentPhuKienKT)}</td>
            </>}
            {visibleGroups.has('giaDung') && <>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slMayLocNuoc)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slNoiCom)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slNoiChien)}</td>
                <td className="px-2 py-3 text-center text-sm">{formatNum(rowData.slQuatDien)}</td>
                <td className="px-2 py-3 text-center text-sm font-semibold">{formatC(rowData.doanhThuGiaDung)}</td>
                <td className={`px-2 py-3 text-center text-sm ${rowData.percentGiaDungKT < 30 ? warningText : boldBlueText}`}>{formatPct(rowData.percentGiaDungKT)}</td>
            </>}
        </>
    );

    const efficiencyKtHeaders = [
        { label: '# Yếu', key: 'belowAverageCount' }, { label: '%BH', key: 'percentBaoHiem' }, { label: '%SIM', key: 'percentSimKT' },
        { label: '%PK', key: 'percentPhuKienKT' }, { label: '%Đ.HỒ', key: 'percentDongHoKT' }, { label: '%GD', key: 'percentGiaDungKT' }
    ];

    const efficiencyDtHeaders = [
        { label: 'SIM', key: 'doanhThuSim' }, { label: 'Đ.HỒ', key: 'doanhThuDongHo' }, { label: 'DT B.HIỂM', key: 'doanhThuBaoHiem' },
        { label: 'DT PK', key: 'doanhThuPhuKien' }, { label: 'DT ĐGD', key: 'doanhThuGiaDung' }
    ];

    const efficiencyQuantityHeaders = [
        { label: 'SL SIM', key: 'slSim' }, { label: 'SL Đ.HỒ', key: 'slDongHo' }, { label: 'SL B.HIỂM', key: 'slBaoHiem' },
        { label: 'SL PK', key: 'slPhuKien' }, { label: 'SL ĐGD', key: 'slGiaDung' }
    ];

    return (
        <div ref={ref}>
            <div className={`border rounded-lg ${tableColorTheme.border} overflow-hidden`}>
                <div className={`p-3 ${tableColorTheme.header} border-b-2 ${tableColorTheme.border}`}>
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold uppercase flex items-center gap-2">
                            <Icon name="gantt-chart-square" size={5} />
                            <span>Bảng Khai Thác</span>
                        </h3>
                        <div className="flex items-center gap-2 hide-on-export">
                            <div className="inline-flex rounded-lg shadow-sm p-1 bg-white/30 dark:bg-slate-900/50">
                                <button onClick={() => setViewMode('detail')} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${viewMode === 'detail' ? 'bg-white dark:bg-slate-700 text-current shadow' : 'text-inherit/80 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>Chi tiết</button>
                                <button onClick={() => setViewMode('efficiency')} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${viewMode === 'efficiency' ? 'bg-white dark:bg-slate-700 text-current shadow' : 'text-inherit/80 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>Hiệu quả %KT</button>
                                <button onClick={() => setViewMode('efficiency_dt_sl')} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${viewMode === 'efficiency_dt_sl' ? 'bg-white dark:bg-slate-700 text-current shadow' : 'text-inherit/80 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>Hiệu quả D.THU</button>
                                <button onClick={() => setViewMode('efficiency_quantity')} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${viewMode === 'efficiency_quantity' ? 'bg-white dark:bg-slate-700 text-current shadow' : 'text-inherit/80 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>Hiệu quả S.Lượng</button>
                            </div>
                            <div className="h-6 w-px bg-current opacity-20"></div>
                            <button onClick={handleAiAnalysis} disabled={isAnalysisLoading} className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors" title="Phân tích bằng AI">
                                {isAnalysisLoading ? <Icon name="loader-2" size={4} className="animate-spin" /> : <Icon name="sparkles" size={4} />}
                            </button>
                             <button onClick={() => onBatchExport(data)} title="Xuất hàng loạt báo cáo chi tiết" className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors">
                                <Icon name="switch-camera" size={4} />
                            </button>
                            {onExport && (
                                <button onClick={onExport} disabled={isExporting} title="Xuất Ảnh Tab" className="p-1.5 rounded-full text-inherit/70 hover:bg-black/10 transition-colors">
                                    {isExporting ? <Icon name="loader-2" size={4} className="animate-spin" /> : <Icon name="camera" size={4} />}
                                </button>
                            )}
                        </div>
                    </div>
                    {viewMode === 'detail' && (
                        <div className="mt-3 hide-on-export">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold mr-2">Hiển thị:</span>
                                {detailQuickFilters.map(f => (
                                    <button 
                                        key={f.key} 
                                        onClick={() => handleToggleGroup(f.key)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 transform hover:scale-105 ${
                                            visibleGroups.has(f.key)
                                            ? 'bg-white dark:bg-slate-800 text-current shadow-lg ring-2 ring-current/50 scale-105'
                                            : 'bg-white/40 dark:bg-slate-800/30 text-current/70 hover:bg-white/80 dark:hover:bg-slate-800/60 hover:text-current'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>


                <div className="overflow-x-auto table-container">
                    <table className="min-w-full compact-export-table performance-table">
                         <thead className={`${tableColorTheme.header}`}>
                            {viewMode === 'detail' ? (
                                <>
                                    <tr className="divide-x divide-current/20">
                                        <th rowSpan={2} onClick={() => handleSort('name')} className={`px-2 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none sticky left-0 bg-inherit z-10 w-40 align-middle ${sortConfig.key === 'name' ? 'text-current' : 'text-inherit/80'} hover:text-current`}>Nhân Viên</th>
                                        {detailQuickFilters.filter(f => visibleGroups.has(f.key)).map(f => <th key={f.key} colSpan={detailHeaderGroups[f.key].colSpan} className="px-2 py-3 text-center font-bold uppercase tracking-wider">{detailHeaderGroups[f.key].label}</th>)}
                                    </tr>
                                    <tr className="divide-x divide-current/20">
                                        {detailQuickFilters.filter(f => visibleGroups.has(f.key)).flatMap(f => detailHeaderGroups[f.key].subHeaders).map(subHeader => <HeaderCell key={subHeader.key} label={subHeader.label} sortKey={subHeader.key} onSort={handleSort} sortConfig={sortConfig}/>)}
                                    </tr>
                                </>
                            ) : (
                                <>
                                     <tr className="divide-x divide-current/20">
                                        <th rowSpan={2} onClick={() => handleSort('name')} className={`px-2 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none sticky left-0 bg-inherit z-10 w-40 align-middle ${sortConfig.key === 'name' ? 'text-current' : 'text-inherit/80'} hover:text-current`}>Nhân Viên</th>
                                        <th colSpan={4} className="px-2 py-3 text-center font-bold uppercase tracking-wider">SỐ LƯỢNG SẢN PHẨM CHÍNH</th>
                                        {viewMode === 'efficiency' ? (
                                            <th colSpan={6} className="px-2 py-3 text-center font-bold uppercase tracking-wider">HIỆU QUẢ KHAI THÁC BÁN KÈM</th>
                                        ) : viewMode === 'efficiency_dt_sl' ? (
                                            <th colSpan={5} className="px-2 py-3 text-center font-bold uppercase tracking-wider">HIỆU QUẢ DOANH THU</th>
                                        ) : (
                                            <th colSpan={5} className="px-2 py-3 text-center font-bold uppercase tracking-wider">HIỆU QUẢ SỐ LƯỢNG</th>
                                        )}
                                    </tr>
                                    <tr className="divide-x divide-current/20">
                                        <HeaderCell label="ICT" sortKey="slICT" onSort={handleSort} sortConfig={sortConfig} />
                                        <HeaderCell label="CE" sortKey="slCE_main" onSort={handleSort} sortConfig={sortConfig} />
                                        <HeaderCell label="ĐGD" sortKey="slGiaDung_main" onSort={handleSort} sortConfig={sortConfig} />
                                        <HeaderCell label="Tổng" sortKey="slSPChinh_Tong" onSort={handleSort} sortConfig={sortConfig} />
                                        {(viewMode === 'efficiency' ? efficiencyKtHeaders : viewMode === 'efficiency_dt_sl' ? efficiencyDtHeaders : efficiencyQuantityHeaders).map(h => <HeaderCell key={h.key} label={h.label} sortKey={h.key as SortConfig['key']} onSort={handleSort} sortConfig={sortConfig} />)}
                                    </tr>
                                </>
                            )}
                        </thead>
                        <tbody>
                            {Object.entries(processedData).map(([dept, employees]) => (
                                <React.Fragment key={dept}>
                                    {showDeptHeaders && (
                                        <tr className={`border-t-2 ${tableColorTheme.border} ${tableColorTheme.row}`}>
                                            <td colSpan={100} className="px-4 py-2 text-sm font-bold sticky left-0 bg-inherit"><div className="flex items-center gap-2"><Icon name="users-round" size={4} /><span>{dept}</span></div></td>
                                        </tr>
                                    )}
                                    {(employees as (ExploitationData & { slSPChinh_Tong: number, belowAverageCount: number })[]).map((employee, index) => {
                                        const medals = ['🥇', '🥈', '🥉'];
                                        const rankIndex = (processedData[dept] as any[]).findIndex(e => e.name === employee.name);
                                        const medal = rankIndex < 3 ? medals[rankIndex] : null;
                                        let rankDisplay = medal ? <span className="text-xl w-6 text-center">{medal}</span> : <span className="text-xs w-6 text-center text-slate-400">#{rankIndex + 1}</span>;
                                        const rowClass = index % 2 === 0 ? 'bg-white dark:bg-slate-800/50' : tableColorTheme.row;

                                        return (
                                            <tr key={employee.name} className={`${rowClass} hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors divide-x divide-slate-200 dark:divide-slate-700`}>
                                                <td className="px-2 py-3 text-left text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap sticky left-0 bg-inherit"><div className="flex items-center gap-2">{rankDisplay}<span>{abbreviateName(employee.name)}</span></div></td>
                                                {viewMode === 'detail' ? renderDetailModeCells(employee) : viewMode === 'efficiency' ? (
                                                    <>
                                                        <td className="px-2 py-3 text-center text-sm">{formatNum(employee.slICT)}</td><td className="px-2 py-3 text-center text-sm">{formatNum(employee.slCE_main)}</td><td className="px-2 py-3 text-center text-sm">{formatNum(employee.slGiaDung_main)}</td><td className="px-2 py-3 text-center text-sm font-semibold">{formatNum((employee as any).slSPChinh_Tong)}</td>
                                                        <td className="px-2 py-3 text-center text-sm font-bold">{((employee as any).belowAverageCount) > 0 ? (employee as any).belowAverageCount : '-'}</td>
                                                        <td className={`px-2 py-3 text-center text-sm ${employee.percentBaoHiem < 40 ? warningText : boldBlueText}`}>{formatPct(employee.percentBaoHiem)}</td>
                                                        <td className={`px-2 py-3 text-center text-sm ${(employee as any).percentSimKT < 30 ? warningText : boldBlueText}`}>{formatPct((employee as any).percentSimKT)}</td>
                                                        <td className={`px-2 py-3 text-center text-sm ${(employee as any).percentPhuKienKT < 10 ? warningText : boldBlueText}`}>{formatPct((employee as any).percentPhuKienKT)}</td>
                                                        <td className={`px-2 py-3 text-center text-sm ${(employee as any).percentDongHoKT < 20 ? warningText : boldBlueText}`}>{formatPct((employee as any).percentDongHoKT)}</td>
                                                        <td className={`px-2 py-3 text-center text-sm ${(employee as any).percentGiaDungKT < 30 ? warningText : boldBlueText}`}>{formatPct((employee as any).percentGiaDungKT)}</td>
                                                    </>
                                                ) : viewMode === 'efficiency_dt_sl' ? (
                                                     <>
                                                        <td className="px-2 py-3 text-center text-sm">{formatNum(employee.slICT)}</td><td className="px-2 py-3 text-center text-sm">{formatNum(employee.slCE_main)}</td><td className="px-2 py-3 text-center text-sm">{formatNum(employee.slGiaDung_main)}</td><td className="px-2 py-3 text-center text-sm font-semibold">{formatNum((employee as any).slSPChinh_Tong)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatC(employee.doanhThuSim)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatC(employee.doanhThuDongHo)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatC(employee.doanhThuBaoHiem)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatC(employee.doanhThuPhuKien)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatC(employee.doanhThuGiaDung)}</td>
                                                    </>
                                                ) : ( // efficiency_quantity
                                                    <>
                                                        <td className="px-2 py-3 text-center text-sm">{formatNum(employee.slICT)}</td><td className="px-2 py-3 text-center text-sm">{formatNum(employee.slCE_main)}</td><td className="px-2 py-3 text-center text-sm">{formatNum(employee.slGiaDung_main)}</td><td className="px-2 py-3 text-center text-sm font-semibold">{formatNum((employee as any).slSPChinh_Tong)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatNum(employee.slSim)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatNum(employee.slDongHo)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatNum(employee.slBaoHiem)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatNum(employee.slPhuKien)}</td>
                                                        <td className="px-2 py-3 text-center text-sm">{formatNum(employee.slGiaDung)}</td>
                                                    </>
                                                )}
                                            </tr>
                                        )
                                    })}
                                    {showDeptHeaders && groupTotals[dept] && (
                                        <tr className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 divide-x divide-slate-200 dark:divide-slate-700">
                                            <td className="px-2 py-3 text-left sticky left-0 bg-inherit">Tổng Nhóm</td>
                                            {viewMode === 'detail' ? renderDetailModeCells(groupTotals[dept]) : viewMode === 'efficiency' ? (
                                                <>
                                                    <td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slICT)}</td><td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slCE_main)}</td><td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slGiaDung_main)}</td><td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slSPChinh_Tong)}</td>
                                                    <td className="px-2 py-3 text-center"></td>
                                                    <td className={`px-2 py-3 text-center ${groupTotals[dept].percentBaoHiem < 40 ? warningText : boldBlueText}`}>{formatPct(groupTotals[dept].percentBaoHiem)}</td>
                                                    <td className={`px-2 py-3 text-center ${groupTotals[dept].percentSimKT < 30 ? warningText : boldBlueText}`}>{formatPct(groupTotals[dept].percentSimKT)}</td>
                                                    <td className={`px-2 py-3 text-center ${groupTotals[dept].percentPhuKienKT < 10 ? warningText : boldBlueText}`}>{formatPct(groupTotals[dept].percentPhuKienKT)}</td>
                                                    <td className={`px-2 py-3 text-center ${groupTotals[dept].percentDongHoKT < 20 ? warningText : boldBlueText}`}>{formatPct(groupTotals[dept].percentDongHoKT)}</td>
                                                    <td className={`px-2 py-3 text-center ${groupTotals[dept].percentGiaDungKT < 30 ? warningText : boldBlueText}`}>{formatPct(groupTotals[dept].percentGiaDungKT)}</td>
                                                </>
                                            ) : viewMode === 'efficiency_dt_sl' ? (
                                                <>
                                                    <td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slICT)}</td><td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slCE_main)}</td><td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slGiaDung_main)}</td><td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slSPChinh_Tong)}</td>
                                                    <td className="px-2 py-3 text-center">{formatC(groupTotals[dept].doanhThuSim)}</td>
                                                    <td className="px-2 py-3 text-center">{formatC(groupTotals[dept].doanhThuDongHo)}</td>
                                                    <td className="px-2 py-3 text-center">{formatC(groupTotals[dept].doanhThuBaoHiem)}</td>
                                                    <td className="px-2 py-3 text-center">{formatC(groupTotals[dept].doanhThuPhuKien)}</td>
                                                    <td className="px-2 py-3 text-center">{formatC(groupTotals[dept].doanhThuGiaDung)}</td>
                                                </>
                                            ) : ( // efficiency_quantity
                                                <>
                                                    <td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slICT)}</td><td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slCE_main)}</td><td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slGiaDung_main)}</td><td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slSPChinh_Tong)}</td>
                                                    <td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slSim)}</td>
                                                    <td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slDongHo)}</td>
                                                    <td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slBaoHiem)}</td>
                                                    <td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slPhuKien)}</td>
                                                    <td className="px-2 py-3 text-center">{formatNum(groupTotals[dept].slGiaDung)}</td>
                                                </>
                                            )}
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot className={`font-extrabold uppercase ${tableColorTheme.header}`}>
                             <tr className={`${tableColorTheme.header}`}>
                                <td className={`px-2 py-3 text-left text-sm border-t-2 ${tableColorTheme.border} sticky left-0 bg-inherit z-10`}>Tổng cộng</td>
                                {viewMode === 'detail' ? renderDetailModeCells(grandTotal) : viewMode === 'efficiency' ? (
                                    <>
                                        <td className="px-2 py-3 text-center">{formatNum(grandTotal.slICT)}</td><td className="px-2 py-3 text-center">{formatNum(grandTotal.slCE_main)}</td><td className="px-2 py-3 text-center">{formatNum(grandTotal.slGiaDung_main)}</td><td className="px-2 py-3 text-center">{formatNum(grandTotal.slSPChinh_Tong)}</td>
                                        <td className="px-2 py-3 text-center"></td>
                                        <td className={`px-2 py-3 text-center ${grandTotal.percentBaoHiem < 40 ? warningText : boldBlueText}`}>{formatPct(grandTotal.percentBaoHiem)}</td>
                                        <td className={`px-2 py-3 text-center ${grandTotal.percentSimKT < 30 ? warningText : boldBlueText}`}>{formatPct(grandTotal.percentSimKT)}</td>
                                        <td className={`px-2 py-3 text-center ${grandTotal.percentPhuKienKT < 10 ? warningText : boldBlueText}`}>{formatPct(grandTotal.percentPhuKienKT)}</td>
                                        <td className={`px-2 py-3 text-center ${grandTotal.percentDongHoKT < 20 ? warningText : boldBlueText}`}>{formatPct(grandTotal.percentDongHoKT)}</td>
                                        <td className={`px-2 py-3 text-center ${grandTotal.percentGiaDungKT < 30 ? warningText : boldBlueText}`}>{formatPct(grandTotal.percentGiaDungKT)}</td>
                                    </>
                                ) : viewMode === 'efficiency_dt_sl' ? (
                                    <>
                                        <td className="px-2 py-3 text-center">{formatNum(grandTotal.slICT)}</td><td className="px-2 py-3 text-center">{formatNum(grandTotal.slCE_main)}</td><td className="px-2 py-3 text-center">{formatNum(grandTotal.slGiaDung_main)}</td><td className="px-2 py-3 text-center">{formatNum(grandTotal.slSPChinh_Tong)}</td>
                                        <td className="px-2 py-3 text-center">{formatC(grandTotal.doanhThuSim)}</td>
                                        <td className="px-2 py-3 text-center">{formatC(grandTotal.doanhThuDongHo)}</td>
                                        <td className="px-2 py-3 text-center">{formatC(grandTotal.doanhThuBaoHiem)}</td>
                                        <td className="px-2 py-3 text-center">{formatC(grandTotal.doanhThuPhuKien)}</td>
                                        <td className="px-2 py-3 text-center">{formatC(grandTotal.doanhThuGiaDung)}</td>
                                    </>
                                ) : ( // efficiency_quantity
                                    <>
                                        <td className="px-2 py-3 text-center">{formatNum(grandTotal.slICT)}</td><td className="px-2 py-3 text-center">{formatNum(grandTotal.slCE_main)}</td><td className="px-2 py-3 text-center">{formatNum(grandTotal.slGiaDung_main)}</td><td className="px-2 py-3 text-center">{formatNum(grandTotal.slSPChinh_Tong)}</td>
                                        <td className="px-2 py-3 text-center">{formatNum(grandTotal.slSim)}</td>
                                        <td className="px-2 py-3 text-center">{formatNum(grandTotal.slDongHo)}</td>
                                        <td className="px-2 py-3 text-center">{formatNum(grandTotal.slBaoHiem)}</td>
                                        <td className="px-2 py-3 text-center">{formatNum(grandTotal.slPhuKien)}</td>
                                        <td className="px-2 py-3 text-center">{formatNum(grandTotal.slGiaDung)}</td>
                                    </>
                                )}
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 {(analysis || isAnalysisLoading) && (
                    <div className="p-4 bg-purple-50 dark:bg-slate-900/50 border-t border-purple-200 dark:border-purple-900/50">
                        <h4 className="font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                            <Icon name="sparkles" />
                            AI Phân Tích Khai Thác
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
        </div>
    );
});

export default IndustryAnalysisTab;
