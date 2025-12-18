
import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatQuantity } from '../../utils/dataUtils';
import { Icon } from '../common/Icon';
import { useDashboardContext } from '../../contexts/DashboardContext';
import { saveKpiTargets, getKpiTargets } from '../../services/dbService';

interface KpiCardsProps {
    onUnshippedClick: () => void;
}

// A more advanced, visually rich KPI card component
const KpiCard: React.FC<{
    icon: string;
    iconColor: string;
    title: string;
    onClick?: () => void;
    children: React.ReactNode;
    debugId?: string;
    debugInfo?: string;
}> = ({ icon, iconColor, title, onClick, children, debugId, debugInfo }) => {
    const isClickable = !!onClick;
    // JIT compiler hints
    // text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50
    // text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50
    // text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/50
    // text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/50
    const baseIconColorClass = `text-${iconColor}-600 dark:text-${iconColor}-400`;
    const baseBgColorClass = `bg-${iconColor}-100 dark:bg-${iconColor}-900/50`;
    
    return (
        <div
            onClick={onClick}
            className={`chart-card p-4 flex flex-col justify-between gap-2 relative overflow-hidden group ${isClickable ? 'cursor-pointer' : ''}`}
            data-debug-id={debugId}
            data-debug-info={debugInfo}
        >
            <Icon name={icon} className={`absolute -top-3 -right-3 w-20 h-20 text-slate-100 dark:text-slate-700/50 opacity-80 group-hover:scale-110 transition-transform duration-300 z-0`} />
            
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${baseBgColorClass} ${baseIconColorClass} flex items-center justify-center`}>
                        <Icon name={icon} size={5} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
                </div>
            </div>
            
            <div className="relative z-10 flex-grow flex items-center">
                {children}
            </div>
        </div>
    );
};

// Inline Editor Component
const KpiTargetEditor: React.FC<{ 
    value: string; 
    onChange: (val: string) => void; 
    onFinish: () => void; 
    onCancel: () => void;
    className?: string;
}> = ({ value, onChange, onFinish, onCancel, className = "" }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    return (
        <div className={`flex items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
            <input
                ref={inputRef}
                type="number"
                min="0"
                max="100"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onFinish}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onFinish();
                    if (e.key === 'Escape') onCancel();
                    e.stopPropagation(); 
                }}
                className="w-14 px-1 py-0.5 text-center text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border-2 border-indigo-500 rounded shadow-sm focus:outline-none focus:ring-0"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">%</span>
        </div>
    );
};

// Gauge component for circular progress
const Gauge: React.FC<{ 
    value: number; 
    color: string; 
    target: number; 
    onTargetClick?: (e: React.MouseEvent) => void;
    isEditing: boolean;
    editValue: string;
    onEditChange: (val: string) => void;
    onEditSubmit: () => void;
    onEditCancel: () => void;
}> = ({ value, color, target, onTargetClick, isEditing, editValue, onEditChange, onEditSubmit, onEditCancel }) => {
    const safeValue = Math.max(0, Math.min(100, value));
    const style = {
        background: `conic-gradient(${color} ${safeValue * 3.6}deg, var(--border-color) 0deg)`,
    };
    return (
        <div className="flex items-center gap-2">
             <div style={style} className="w-12 h-12 rounded-full flex items-center justify-center relative transition-all">
                <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800"></div>
             </div>
             
             {isEditing ? (
                 <KpiTargetEditor 
                    value={editValue} 
                    onChange={onEditChange} 
                    onFinish={onEditSubmit} 
                    onCancel={onEditCancel} 
                 />
             ) : (
                 <div 
                    className="cursor-pointer group/label hover:bg-slate-100 dark:hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                    onClick={onTargetClick}
                    title="Nhấn để sửa mục tiêu"
                 >
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        Mục tiêu <Icon name="edit-2" size={3} className="opacity-0 group-hover/label:opacity-100 transition-opacity text-indigo-500" />
                    </p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-base group-hover/label:text-indigo-600 dark:group-hover/label:text-indigo-400 transition-colors">
                        {target}%
                    </p>
                 </div>
             )}
        </div>
    );
}

// Linear progress bar
const ProgressBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}></div>
  </div>
);

const KpiCards: React.FC<KpiCardsProps> = ({ onUnshippedClick }) => {
    const { processedData } = useDashboardContext();
    const kpis = processedData?.kpis;
    const [targets, setTargets] = useState({ hieuQua: 40, traGop: 45 });
    
    // State for inline editing
    const [editingState, setEditingState] = useState<{ field: 'hieuQua' | 'traGop' | null, value: string }>({ field: null, value: '' });

    useEffect(() => {
        getKpiTargets().then(saved => {
            if (saved) {
                setTargets(saved);
            }
        });
    }, []);

    const startEditing = (e: React.MouseEvent, field: 'hieuQua' | 'traGop') => {
        e.preventDefault();
        e.stopPropagation();
        setEditingState({ field, value: (field === 'hieuQua' ? targets.hieuQua : targets.traGop).toString() });
    };

    const handleEditChange = (val: string) => {
        setEditingState(prev => ({ ...prev, value: val }));
    };

    const submitEditing = () => {
        if (!editingState.field) return;
        const newVal = parseFloat(editingState.value);
        // Save if valid, or just cancel if empty/invalid
        if (!isNaN(newVal) && newVal >= 0 && newVal <= 100) {
            const newTargets = { ...targets, [editingState.field]: newVal };
            setTargets(newTargets);
            saveKpiTargets(newTargets).catch(console.error);
        }
        setEditingState({ field: null, value: '' });
    };

    const cancelEditing = () => {
        setEditingState({ field: null, value: '' });
    };

    if (!kpis) {
        return null;
    }

    const debugInfo = {
        dtqd: {
            name: "KPI: Doanh thu Quy đổi (DTQĐ)",
            description: "Là chỉ số doanh thu chính, được tính bằng cách nhân Doanh thu Thực với một hệ số quy đổi tùy theo ngành hàng. Phản ánh giá trị thực tế mà sản phẩm mang lại. Bên cạnh là Doanh thu Thực (giá bán thực tế) và tổng số lượng đơn hàng Dịch vụ Thu hộ.",
            design: "Sử dụng màu xanh dương (blue) làm chủ đạo. Font số lớn, đậm để nhấn mạnh giá trị chính. Các chỉ số phụ được đặt bên cạnh để cung cấp thêm ngữ cảnh."
        },
        hieuQua: {
            name: "KPI: Hiệu quả Quy đổi (HQQĐ)",
            description: "Đo lường mức độ hiệu quả của việc bán hàng, được tính bằng công thức ((DTQĐ - DT Thực) / DT Thực) * 100. Chỉ số này càng cao, chứng tỏ siêu thị bán được nhiều sản phẩm có hệ số quy đổi cao.",
            design: "Sử dụng màu xanh lá (teal) và biểu đồ Gauge để so sánh giá trị hiện tại với mục tiêu. Màu sắc thay đổi dựa trên việc đạt mục tiêu hay không. Mục tiêu có thể tùy chỉnh."
        },
        traCham: {
            name: "KPI: Tỷ lệ Trả góp",
            description: "Phản ánh tỷ lệ đơn hàng trả góp trên tổng số đơn hàng có doanh thu. Được tính bằng (Số lượng đơn trả góp / Tổng số đơn hàng hợp lệ) * 100.",
            design: "Sử dụng màu hồng (pink). Hiển thị các thông tin phụ như tổng Doanh thu trả góp và số lượng đơn. Thanh ProgressBar được dùng để so sánh tỷ lệ hiện tại với mục tiêu có thể tùy chỉnh."
        },
        choXuat: {
            name: "KPI: Doanh thu QĐ Chờ xuất",
            description: "Tổng hợp Doanh thu Quy đổi từ các đơn hàng đã được xác nhận nhưng chưa được xuất kho. Đây là một chỉ số quan trọng cần theo dõi để đảm bảo hàng hóa được giao đúng hẹn. Thẻ này có thể click để xem danh sách chi tiết các đơn hàng chờ xuất.",
            design: "Sử dụng màu đỏ (red) để cảnh báo và thu hút sự chú ý. Có thể click được, con trỏ sẽ thay đổi khi di chuột qua. Hiển thị cả DTQĐ và DT Thực chờ xuất."
        }
    };

    // Logic for Hieu Qua
    const hieuQuaValue = kpis.hieuQuaQD * 100;
    const hieuQuaColor = hieuQuaValue >= targets.hieuQua ? '#008000' : '#EAB308'; // Green if met, Amber if not
    const hieuQuaColorClass = hieuQuaValue >= targets.hieuQua ? 'text-[#008000] dark:text-green-400' : 'text-amber-500 dark:text-amber-400';

    // Logic for Tra Gop
    const traGopColor = kpis.traGopPercent >= targets.traGop ? '#059669' : '#980000'; // Teal if met, Red if not
    const traGopColorClass = kpis.traGopPercent >= targets.traGop ? 'text-teal-600 dark:text-teal-400' : 'text-[#980000] dark:text-red-400';
    
    const formattedDoanhThuQD = formatCurrency(kpis.doanhThuQD);
    const partsDoanhThuQD = formattedDoanhThuQD.split(' ');
    const numberPartDTQD = partsDoanhThuQD[0];
    const unitPartDTQD = partsDoanhThuQD.length > 1 ? partsDoanhThuQD.slice(1).join(' ') : null;
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 kpi-grid-for-export">
            <KpiCard icon="wallet-cards" iconColor="blue" title="Doanh Thu Quy Đổi" debugId="KPI.DTQD" debugInfo={JSON.stringify(debugInfo.dtqd)}>
                <div className="flex w-full items-center gap-4">
                    {/* Main Part */}
                    <div className="flex-grow min-w-0">
                        <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 flex items-baseline">
                           <span>{numberPartDTQD}</span>
                           {unitPartDTQD && <span className="text-2xl font-bold ml-1">{unitPartDTQD}</span>}
                        </div>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-600 self-stretch"></div>

                    {/* Auxiliary Part */}
                    <div className="text-sm space-y-1 text-right flex-shrink-0">
                        <div>
                            <span className="text-slate-500 dark:text-slate-400">Thực: </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(kpis.totalRevenue)}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400">Thu hộ: </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{formatQuantity(kpis.soLuongThuHo)}</span>
                        </div>
                    </div>
                </div>
            </KpiCard>
            
            <KpiCard icon="trending-up" iconColor="teal" title="Hiệu Quả Quy Đổi" debugId="KPI.HieuQua" debugInfo={JSON.stringify(debugInfo.hieuQua)}>
                 <div className="flex w-full items-center gap-4">
                    {/* Main Part */}
                    <div className="flex-grow min-w-0">
                        <p className={`text-4xl font-extrabold ${hieuQuaColorClass}`}>{hieuQuaValue.toFixed(0)}%</p>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-600 self-stretch"></div>

                    {/* Auxiliary Part */}
                    <div className="flex-shrink-0 relative z-20">
                        <Gauge 
                            value={hieuQuaValue} 
                            color={hieuQuaColor} 
                            target={targets.hieuQua} 
                            onTargetClick={(e) => startEditing(e, 'hieuQua')}
                            isEditing={editingState.field === 'hieuQua'}
                            editValue={editingState.value}
                            onEditChange={handleEditChange}
                            onEditSubmit={submitEditing}
                            onEditCancel={cancelEditing}
                        />
                    </div>
                 </div>
            </KpiCard>

            <KpiCard icon="receipt" iconColor="pink" title="Tỷ Lệ Trả Góp" debugId="KPI.TraGop" debugInfo={JSON.stringify(debugInfo.traCham)}>
                 <div className="flex w-full items-center gap-4">
                    {/* Main Part */}
                    <div className="flex-grow min-w-0">
                        <p className={`text-4xl font-extrabold ${traGopColorClass}`}>{kpis.traGopPercent.toFixed(0)}%</p>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-600 self-stretch"></div>
                    
                    {/* Auxiliary Part */}
                    <div className="flex-shrink-0 w-32 relative z-20">
                        <div className="text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400">DT:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(kpis.traGopValue)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                                <span className="text-slate-500 dark:text-slate-400">SL:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{formatQuantity(kpis.traGopCount)}</span>
                            </div>
                        </div>
                        <ProgressBar value={(kpis.traGopPercent / targets.traGop) * 100} color={traGopColor} />
                        
                        {editingState.field === 'traGop' ? (
                             <div className="mt-1 flex justify-center">
                                <KpiTargetEditor 
                                    value={editingState.value} 
                                    onChange={handleEditChange} 
                                    onFinish={submitEditing} 
                                    onCancel={cancelEditing} 
                                />
                             </div>
                        ) : (
                             <div 
                                className="text-center mt-1 flex justify-center items-center gap-1 group/label cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 p-1 rounded-md transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                                onClick={(e) => startEditing(e, 'traGop')}
                                title="Nhấn để sửa mục tiêu"
                             >
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    Mục tiêu <Icon name="edit-2" size={3} className="opacity-0 group-hover/label:opacity-100 transition-opacity text-indigo-500" />
                                </p>
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-xs group-hover/label:text-indigo-600 dark:group-hover/label:text-indigo-400 transition-colors">
                                    : {targets.traGop}%
                                </span>
                             </div>
                        )}
                    </div>
                 </div>
            </KpiCard>
            
            <KpiCard icon="archive-restore" iconColor="red" title="Doanh Thu QĐ Chờ Xuất" onClick={onUnshippedClick} debugId="KPI.ChoXuat" debugInfo={JSON.stringify(debugInfo.choXuat)}>
                 <div className="flex w-full items-center gap-4">
                    {/* Main Part */}
                    <div className="flex-grow min-w-0">
                        <p className="text-4xl font-extrabold text-[#ff0000] dark:text-red-500">{formatCurrency(kpis.doanhThuQDChoXuat)}</p>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-600 self-stretch"></div>

                    {/* Auxiliary Part */}
                    <div className="flex-shrink-0 text-sm space-y-1 text-right">
                        <div>
                           <span className="text-slate-500 dark:text-slate-400">DT Thực:</span>
                           <br/>
                           <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(kpis.doanhThuThucChoXuat)}</span>
                        </div>
                        <div className="font-semibold text-[#ff0000] dark:text-red-500 hover:underline mt-1 flex items-center gap-1 justify-end">
                           <span>Xem chi tiết</span>
                           <Icon name="arrow-right" size={3} />
                        </div>
                    </div>
                 </div>
            </KpiCard>
        </div>
    );
};

export default KpiCards;
