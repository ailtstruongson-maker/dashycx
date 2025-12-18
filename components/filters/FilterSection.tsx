
import React, { useState, useMemo } from 'react';
import type { VisibilityState } from '../../types';
import { toLocalISOString } from '../../utils/dataUtils';
import { Icon } from '../common/Icon';
import { useDashboardContext } from '../../contexts/DashboardContext';
import DropdownFilter from '../common/DropdownFilter';

const ModernSwitch: React.FC<{ label: string; icon: string; isActive: boolean; onToggle: () => void; color: string; debugId?: string; debugInfo?: string; }> = ({ label, icon, isActive, onToggle, color, debugId, debugInfo }) => {
    const bgColor = `bg-${color}-50 dark:bg-${color}-900/20`;
    const hoverBgColor = `hover:bg-${color}-100/60 dark:hover:bg-${color}-800/40`;
    // Changed border width to 2 and darkened the shade (200->300, 700->600) for better visibility
    const borderColor = `border-2 border-${color}-300 dark:border-${color}-600`;
    const activeIconColor = `text-${color}-600 dark:text-${color}-400`;
    const activeTextColor = `text-${color}-700 dark:text-${color}-300`;
    const activeSwitchBg = `bg-${color}-600`;

    return (
        <label
            htmlFor={`switch-${label}`}
            title={`Hiển thị/Ẩn ${label}`}
            className={`flex items-center cursor-pointer justify-between w-full p-2.5 rounded-lg ${bgColor} ${hoverBgColor} ${borderColor} transition-colors ${isActive ? `border-l-${color}-500` : ''}`}
            data-debug-id={debugId}
            data-debug-info={debugInfo}
        >
            <div className="flex items-center gap-3">
                <Icon name={icon} size={5} className={`transition-colors ${isActive ? activeIconColor : 'text-slate-500 dark:text-slate-400'}`}/>
                <span className={`font-semibold text-sm transition-colors ${isActive ? activeTextColor : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
            </div>
            <div className="relative">
                <input id={`switch-${label}`} type="checkbox" className="sr-only" checked={isActive} onChange={onToggle} />
                <div className={`block w-12 h-6 rounded-full transition-colors border ${isActive ? `${activeSwitchBg} border-${color}-600` : 'bg-slate-300 dark:bg-slate-600 border-slate-400 dark:border-slate-500'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-6' : ''}`}></div>
            </div>
        </label>
    );
};


interface FilterSectionProps {
    options: { kho: string[]; trangThai: string[]; nguoiTao: string[]; department: string[] };
    visibility: VisibilityState;
    onVisibilityChange: (component: keyof VisibilityState, isVisible: boolean) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ options, visibility, onVisibilityChange }) => {
    const { filterState: filters, handleFilterChange: onFilterChange, originalData: allData } = useDashboardContext();
    const [isExpanded, setIsExpanded] = useState(true);
    
    const debugInfo = {
        kho: { name: "Bộ lọc Kho", description: "Lọc toàn bộ dữ liệu theo mã kho được chọn. Chọn 'All' để xem dữ liệu từ tất cả các kho.", design: "Sử dụng 'segmented control' (nút chọn phân đoạn) để chuyển đổi giữa các kho. Chỉ hiển thị khi có nhiều hơn một kho trong dữ liệu." },
        xuat: { name: "Bộ lọc Trạng thái Xuất", description: "Lọc dữ liệu dựa trên trạng thái xuất hàng của đơn: 'Đã' xuất, 'Chưa' xuất, hoặc 'All' (tất cả).", design: "Sử dụng 'segmented control' để lựa chọn nhanh chóng và trực quan." },
        department: { name: "Bộ lọc Bộ phận", description: "Lọc nhân viên theo bộ phận đã được định nghĩa trong file phân ca. Đây là dropdown đa lựa chọn, cho phép xem hiệu suất của một hoặc nhiều bộ phận cùng lúc.", design: "Component DropdownFilter với thanh tìm kiếm, checkbox 'Chọn tất cả' và danh sách các tùy chọn." },
        nguoiTao: { name: "Bộ lọc Người Tạo", description: "Lọc dữ liệu theo người tạo đơn hàng cụ thể. Đây là dropdown đa lựa chọn.", design: "Component DropdownFilter với thanh tìm kiếm." },
        trangThai: { name: "Bộ lọc Trạng thái SP", description: "Lọc dữ liệu theo trạng thái của sản phẩm trong đơn hàng (ví dụ: 'YCX-BHSC', 'YCX-Đổi SP mới'...).", design: "Component DropdownFilter với thanh tìm kiếm." },
        dateRange: { name: "Bộ lọc nhanh Khoảng Thời Gian", description: "Cung cấp các nút chọn nhanh để lọc dữ liệu theo các khoảng thời gian phổ biến như 'Hôm nay', 'Tuần này', 'Tháng trước'...", design: "Một nhóm các nút bấm. Khi một nút được chọn, nó sẽ tự động cập nhật hai ô 'Từ ngày' và 'Đến ngày'." },
        dateInputs: { name: "Bộ lọc Tùy chỉnh Ngày", description: "Cho phép người dùng chọn một khoảng thời gian bất kỳ để phân tích dữ liệu.", design: "Hai ô input type='date' để chọn ngày bắt đầu và ngày kết thúc." },
        visibility: { name: "Công tắc Hiển thị Khu vực", description: "Cho phép người dùng bật/tắt các thành phần chính trên dashboard (Xu hướng, Tỷ trọng ngành, Phân tích NV, Chi tiết ngành) để tập trung vào thông tin họ quan tâm.", design: "Sử dụng component 'ModernSwitch' (nút gạt) cho từng khu vực. Trạng thái được lưu trong state của DashboardView." }
    };

    const handleResetFilters = () => {
         const allTrangThai = [...new Set(allData.map(r => r['Trạng thái hồ sơ']).filter(Boolean))]; 
         const allNguoiTao = [...new Set(allData.map(r => r['Người tạo']).filter(Boolean))];
        onFilterChange({
            kho: 'all',
            xuat: 'all',
            trangThai: allTrangThai,
            nguoiTao: allNguoiTao,
            department: options.department || [],
            startDate: '',
            endDate: '',
            dateRange: 'all',
        });
    };

    const handleDateRangeClick = (range: string) => {
        let start: Date | null = null, end: Date | null = null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (range) {
            case 'today': start = today; end = today; break;
            case 'yesterday': start = new Date(today); start.setDate(today.getDate() - 1); end = start; break;
            case 'week': {
                start = new Date(today);
                const day = start.getDay();
                start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            }
            case 'last-week': {
                start = new Date(today);
                start.setDate(start.getDate() - 7);
                const day = start.getDay();
                start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            }
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'last-month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
        }
        onFilterChange({
            startDate: toLocalISOString(start),
            endDate: toLocalISOString(end),
            dateRange: range
        });
    };

    const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
        onFilterChange({ [type]: value, dateRange: '' });
    };
    
    const handleDropdownChange = (type: string, selected: string[]) => {
        onFilterChange({ [type as keyof typeof filters]: selected });
    }

    const visibilityOptions = [
        { key: 'trendChart', label: 'Xu Hướng', icon: 'area-chart', color: 'violet' },
        { key: 'industryGrid', label: 'Tỷ Trọng Ngành', icon: 'layout-grid', color: 'emerald' },
        { key: 'employeeAnalysis', label: 'Phân Tích NV', icon: 'users-round', color: 'rose' },
        { key: 'summaryTable', label: 'Chi Tiết Ngành', icon: 'table', color: 'amber' },
    ];

    // Generate summary text for collapsed view
    const filterSummary = useMemo(() => {
        const parts = [];
        if (filters.kho !== 'all') parts.push(`Kho: ${filters.kho}`);
        if (filters.xuat !== 'all') parts.push(`Xuất: ${filters.xuat}`);
        
        if (filters.dateRange !== 'all') {
            const rangeLabels: Record<string, string> = {
                'today': 'Hôm nay', 'yesterday': 'Hôm qua',
                'week': 'Tuần này', 'last-week': 'Tuần trước',
                'month': 'Tháng này', 'last-month': 'Tháng trước'
            };
            if (rangeLabels[filters.dateRange]) parts.push(rangeLabels[filters.dateRange]);
        } else if (filters.startDate || filters.endDate) {
            parts.push(`${filters.startDate ? filters.startDate.split('-').reverse().join('/') : '...'} - ${filters.endDate ? filters.endDate.split('-').reverse().join('/') : '...'}`);
        }

        const countFilters = (arr: string[], total: number) => {
            if (arr.length > 0 && arr.length < total) return arr.length;
            return 0;
        };

        const deptCount = countFilters(filters.department, options.department.length);
        if (deptCount) parts.push(`${deptCount} bộ phận`);

        const creatorCount = countFilters(filters.nguoiTao, options.nguoiTao.length);
        if (creatorCount) parts.push(`${creatorCount} người tạo`);

        const statusCount = countFilters(filters.trangThai, options.trangThai.length);
        if (statusCount) parts.push(`${statusCount} trạng thái`);

        return parts.length > 0 ? parts.join(' • ') : 'Hiển thị tất cả dữ liệu';
    }, [filters, options]);

    return (
        <div className={`sticky top-0 z-30 transition-all duration-300 ease-in-out hide-on-export ${isExpanded ? 'mb-6' : 'mb-4'}`}>
            <div className={`bg-white/80 dark:bg-slate-800/80 shadow-lg border-b border-white/20 dark:border-slate-700/50 backdrop-blur-md ${isExpanded ? 'rounded-b-2xl' : 'rounded-b-xl'}`}>
                {/* Header / Collapsed View */}
                <div 
                    className="flex justify-between items-center p-3 sm:px-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                            <Icon name="filter" size={5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">Bộ Lọc Dữ Liệu</h2>
                            {!isExpanded && (
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate animate-fade-in-up">
                                    {filterSummary}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Reset Button - Always Visible in Header */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleResetFilters(); }} 
                            title="Đặt lại bộ lọc về mặc định"
                            className="flex py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors items-center gap-1.5 border border-slate-200 dark:border-slate-600 shadow-sm"
                        >
                            <Icon name="rotate-cw" size={3.5} />
                            <span className="hidden sm:inline">Đặt lại</span>
                        </button>
                        
                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>

                        {/* Expand/Collapse Chevron */}
                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <Icon name="chevron-down" size={5} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Expanded Body */}
                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0'}`}>
                    <div className="p-5 border-t border-slate-200 dark:border-slate-700 cursor-default" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Main Filters */}
                            <div className="flex-grow space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div data-debug-id="Filter.Kho" data-debug-info={JSON.stringify(debugInfo.kho)} className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700">
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300">Kho Tạo</label>
                                        <div className="inline-flex rounded-lg shadow-sm p-1 bg-white/60 dark:bg-slate-800/50 mt-2">
                                            <button onClick={() => onFilterChange({ kho: 'all' })} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${filters.kho === 'all' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>All</button>
                                            {options.kho.map(kho => (
                                            <button key={kho} onClick={() => onFilterChange({ kho })} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${filters.kho === kho ? 'bg-sky-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>{kho}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div data-debug-id="Filter.Xuat" data-debug-info={JSON.stringify(debugInfo.xuat)} className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700">
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300">Trạng Thái Xuất</label>
                                        <div className="inline-flex rounded-lg shadow-sm p-1 bg-white/60 dark:bg-slate-800/50 mt-2">
                                            {['all', 'Đã', 'Chưa'].map(val => (
                                            <button key={val} onClick={() => onFilterChange({ xuat: val })} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${filters.xuat === val ? 'bg-teal-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>{val === 'all' ? 'All' : val}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {options.department.length > 0 && (
                                        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                                            <DropdownFilter 
                                                type="department" 
                                                label="Bộ phận" 
                                                options={options.department} 
                                                selected={filters.department} 
                                                onChange={handleDropdownChange} 
                                                debugId="Filter.Department"
                                                debugInfo={JSON.stringify(debugInfo.department)}
                                            />
                                        </div>
                                    )}
                                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                                        <DropdownFilter type="nguoiTao" label="Người Tạo" options={options.nguoiTao} selected={filters.nguoiTao} onChange={handleDropdownChange} debugId="Filter.NguoiTao" debugInfo={JSON.stringify(debugInfo.nguoiTao)} />
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700">
                                        <DropdownFilter type="trangThai" label="Trạng thái SP" options={options.trangThai} selected={filters.trangThai} onChange={handleDropdownChange} debugId="Filter.TrangThai" debugInfo={JSON.stringify(debugInfo.trangThai)} />
                                    </div>
                                </div>
                            </div>

                            {/* Vertical Divider */}
                            <div className="hidden lg:block border-l border-slate-200 dark:border-slate-700"></div>

                            {/* Date Filters */}
                            <div className="flex flex-col gap-4 lg:min-w-[400px] lg:max-w-[420px]">
                                <div data-debug-id="Filter.DateRange" data-debug-info={JSON.stringify(debugInfo.dateRange)} className="p-2.5 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-200 dark:border-fuchsia-700">
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300">Khoảng Thời Gian</label>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {[
                                            { range: 'today', label: 'H.Nay' }, { range: 'yesterday', label: 'H.Qua' },
                                            { range: 'week', label: 'Tuần này' }, { range: 'last-week', label: 'Tuần trước' },
                                            { range: 'month', label: 'Tháng này' }, { range: 'last-month', label: 'Tháng trước' },
                                            { range: 'all', label: 'All' }
                                        ].map(({ range, label }) => (
                                            <button key={range} onClick={() => handleDateRangeClick(range)} className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${filters.dateRange === range ? 'bg-fuchsia-600 text-white shadow' : 'bg-slate-100/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}>{label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-end gap-3 p-2.5 rounded-lg bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-700" data-debug-id="Filter.DateInputs" data-debug-info={JSON.stringify(debugInfo.dateInputs)}>
                                    <div className="flex-1">
                                        <label htmlFor="start-date" className="block text-sm font-bold text-lime-700 dark:text-lime-300 mb-2">Từ ngày</label>
                                        <input type="date" id="start-date" value={filters.startDate} onChange={e => handleDateChange('startDate', e.target.value)} className="w-full bg-white/60 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="end-date" className="block text-sm font-bold text-lime-700 dark:text-lime-300 mb-2">Đến ngày</label>
                                        <input type="date" id="end-date" value={filters.endDate} onChange={e => handleDateChange('endDate', e.target.value)} className="w-full bg-white/60 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700 mt-6 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {visibilityOptions.map(opt => (
                                    <ModernSwitch
                                        key={opt.key}
                                        label={opt.label}
                                        icon={opt.icon}
                                        isActive={visibility[opt.key as keyof VisibilityState]}
                                        onToggle={() => onVisibilityChange(opt.key as keyof VisibilityState, !visibility[opt.key as keyof VisibilityState])}
                                        color={opt.color}
                                        debugId={`Filter.Visibility.${opt.key}`}
                                        debugInfo={JSON.stringify(debugInfo.visibility)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSection;
