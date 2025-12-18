
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { WarehouseColumnConfig, WarehouseCategoryType, WarehouseMetricType } from '../../types';
import ModalWrapper from '../modals/ModalWrapper';
import { Icon } from '../common/Icon';
import SearchableSelect from '../common/SearchableSelect';
import { WAREHOUSE_METRIC_TYPE_MAP, WAREHOUSE_HEADER_COLORS, DEFAULT_WAREHOUSE_COLUMNS } from '../../constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    columns: WarehouseColumnConfig[];
    onSave: (newColumns: WarehouseColumnConfig[]) => void;
    allIndustries: string[];
    allGroups: string[];
    allManufacturers: string[];
}

const WarehouseSettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, columns, onSave, allIndustries, allGroups, allManufacturers }) => {
    const [internalColumns, setInternalColumns] = useState<WarehouseColumnConfig[]>([]);
    const [view, setView] = useState<'picker' | 'form'>('picker');
    
    // Form state
    const [editingColumn, setEditingColumn] = useState<WarehouseColumnConfig | null>(null);
    const [mainHeader, setMainHeader] = useState('');
    const [subHeader, setSubHeader] = useState('');
    const [categoryType, setCategoryType] = useState<WarehouseCategoryType>('industry');
    const [categoryName, setCategoryName] = useState('');
    const [manufacturerName, setManufacturerName] = useState('');
    const [productCodesInput, setProductCodesInput] = useState<string>('');
    const [metricType, setMetricType] = useState<WarehouseMetricType>('quantity');
    
    const mainHeaderInputRef = useRef<HTMLInputElement>(null);

    // Color map is now imported from constants.ts

    useEffect(() => {
        if (isOpen) {
            const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
            setInternalColumns(sortedColumns);
            setView('picker');
            resetForm(false);
        }
    }, [isOpen, columns]);
    
    useEffect(() => {
        if (view === 'form' && editingColumn === null) {
            mainHeaderInputRef.current?.focus();
        }
    }, [view, editingColumn]);

    const groupedColumns = useMemo(() => {
        return internalColumns.reduce<Record<string, WarehouseColumnConfig[]>>((acc, col) => {
            const key = col.mainHeader || 'Chưa phân loại';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(col);
            return acc;
        }, {});
    }, [internalColumns]);

    const resetForm = (switchToPicker = true) => {
        setEditingColumn(null);
        setMainHeader(''); setSubHeader(''); setCategoryType('industry');
        setCategoryName(''); setManufacturerName(''); setMetricType('quantity');
        setProductCodesInput('');
        if (switchToPicker) {
            setView('picker');
        }
    };

    const handleEdit = (column: WarehouseColumnConfig) => {
        setEditingColumn(column);
        setMainHeader(column.mainHeader);
        setSubHeader(column.subHeader);
        setCategoryType(column.categoryType || 'industry');
        setCategoryName(column.categoryName || '');
        setManufacturerName(column.manufacturerName || '');
        setProductCodesInput(column.productCodes?.join(', ') || '');
        setMetricType(column.metricType || 'quantity');
        setView('form');
    };
    
    const handleSaveAndClose = () => {
        const reorderedColumns = internalColumns.map((c, i) => ({ ...c, order: i }));
        onSave(reorderedColumns);
        onClose();
    };

    const handleToggleVisibility = (id: string) => {
        setInternalColumns(prev => prev.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa cột tùy chỉnh này?')) {
            setInternalColumns(prev => prev.filter(c => c.id !== id));
        }
    };
    
    const handleDeleteGroup = (groupName: string) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa nhóm "${groupName}" và tất cả các cột bên trong?`)) {
            setInternalColumns(prev => prev.filter(c => c.mainHeader !== groupName));
        }
    };

    const handleToggleGroupVisibility = (mainHeader: string, shouldBeVisible: boolean) => {
        setInternalColumns(prev => prev.map(c => c.mainHeader === mainHeader ? { ...c, isVisible: shouldBeVisible } : c));
    };
    
    const handleSaveColumn = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!mainHeader.trim() || !subHeader.trim()) {
            alert('Vui lòng điền đầy đủ Tiêu đề chính và Tiêu đề phụ.');
            return;
        }

        const productCodes = productCodesInput.split(/[\s,]+/).map(code => code.trim()).filter(Boolean);

        const newColumnData = {
            mainHeader: mainHeader.trim(), subHeader: subHeader.trim(), categoryType, 
            categoryName: categoryName || undefined, 
            manufacturerName: manufacturerName || undefined, 
            productCodes: productCodes.length > 0 ? productCodes : undefined,
            metricType 
        };

        if (editingColumn) {
            setInternalColumns(prev => prev.map(col => col.id === editingColumn.id ? { ...col, ...newColumnData } : col));
        } else {
            const newColumn: WarehouseColumnConfig = {
                id: `custom_${Date.now()}`,
                order: internalColumns.length, isVisible: true, isCustom: true,
                ...newColumnData
            };
            setInternalColumns(prev => [...prev, newColumn]);
        }
        resetForm();
    };
    
    const handleSelectAll = (select: boolean) => {
        setInternalColumns(prev => prev.map(c => ({...c, isVisible: select})));
    };

    const handleRestoreDefaults = () => {
        if (window.confirm('Thao tác này sẽ xóa tất cả các tùy chỉnh và khôi phục lại bố cục cột mặc định. Bạn có chắc chắn?')) {
            setInternalColumns([...DEFAULT_WAREHOUSE_COLUMNS]); // Copy from constants
            resetForm();
        }
    };

    // Mapping colors for the picker UI (approximate match to table headers)
    const groupColorMap: Record<string, string> = {
        'Doanh Thu': 'bg-sky-400 hover:bg-sky-500',
        'TRAFFIC & TỶ LỆ TC/DT': 'bg-cyan-400 hover:bg-cyan-500',
        'S.PHẨM CHÍNH': 'bg-teal-400 hover:bg-teal-500',
        'SL BÁN KÈM': 'bg-violet-400 hover:bg-violet-500',
        'DT THỰC NGÀNH HÀNG': 'bg-purple-400 hover:bg-purple-500',
        'Phụ Kiện': 'bg-fuchsia-400 hover:bg-fuchsia-500',
        'Gia Dụng': 'bg-rose-400 hover:bg-rose-500',
        'DEFAULT': 'bg-indigo-400 hover:bg-indigo-500',
    };

    const renderPickerView = () => (
        <>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleSelectAll(true)} className="text-sm font-semibold text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">Chọn tất cả</button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button onClick={() => handleSelectAll(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Bỏ chọn tất cả</button>
                </div>
                 <button onClick={() => { resetForm(false); setView('form'); }} title="Thêm Cột Mới" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
                    Thêm cột mới
                </button>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                 {Object.entries(groupedColumns).map(([mainHeader, cols]) => {
                    if (!Array.isArray(cols)) return null;
                    const visibleCount = cols.filter(c => c.isVisible).length;
                    const isCustomGroup = cols.every(c => c.isCustom);
                    return (
                        <details key={mainHeader} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg group" open>
                            <summary className="flex justify-between items-center p-3 cursor-pointer list-none">
                                <div className="flex items-center gap-3">
                                    {isCustomGroup && (
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleDeleteGroup(mainHeader); }}
                                            title={`Xóa nhóm ${mainHeader}`}
                                            className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-full"
                                        >
                                            <Icon name="trash-2" size={4}/>
                                        </button>
                                    )}
                                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{mainHeader}</h4>
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{visibleCount}/{cols.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.preventDefault(); handleToggleGroupVisibility(mainHeader, true); }} title="Chọn tất cả trong nhóm" className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"><Icon name="refresh-cw" size={4}/></button>
                                    <Icon name="chevron-down" size={5} className="text-slate-400 transition-transform duration-300 group-open:rotate-180" />
                                </div>
                            </summary>
                            <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                                {cols.map(col => {
                                    const colorClass = groupColorMap[mainHeader] || groupColorMap.DEFAULT;
                                    return (
                                        <div key={col.id} className={`relative group/item rounded-lg transition-colors text-sm font-medium ${col.isVisible ? `${colorClass} text-white` : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                            <button onClick={() => handleToggleVisibility(col.id)} className="w-full h-full px-3 py-2 text-left" title={col.subHeader}>
                                                {col.subHeader}
                                            </button>
                                            {col.isCustom && (
                                                <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(col)} className="p-1 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600"><Icon name="edit-3" size={3} /></button>
                                                    <button onClick={() => handleDelete(col.id)} className="p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"><Icon name="trash-2" size={3} /></button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    )
                })}
            </div>
        </>
    );
    
    const renderFormView = () => (
        <form onSubmit={handleSaveColumn} className="space-y-4 h-full flex flex-col">
            <h3 className="font-semibold text-xl text-slate-800 dark:text-slate-100">{editingColumn ? `Chỉnh Sửa Cột: ${editingColumn.subHeader}` : 'Thêm Cột Mới'}</h3>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="mainHeader" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tiêu đề chính *</label>
                        <input ref={mainHeaderInputRef} id="mainHeader" value={mainHeader} onChange={e => setMainHeader(e.target.value)} placeholder="VD: Phụ Kiện" className="w-full h-11 block rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div>
                        <label htmlFor="subHeader" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tiêu đề phụ *</label>
                        <input id="subHeader" value={subHeader} onChange={e => setSubHeader(e.target.value)} placeholder="VD: SL Camera" className="w-full h-11 block rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loại danh mục</label>
                        <select value={categoryType} onChange={e => { setCategoryType(e.target.value as WarehouseCategoryType); setCategoryName(''); }} className="w-full h-11 block rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option value="industry">Theo Ngành hàng</option>
                            <option value="group">Theo Nhóm hàng</option>
                        </select>
                    </div>
                    <SearchableSelect
                        label="Danh mục chính"
                        options={(categoryType === 'industry' ? allIndustries : allGroups)}
                        value={categoryName}
                        onChange={setCategoryName}
                        placeholder="-- Tùy chọn --"
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loại chỉ số</label>
                        <select value={metricType} onChange={e => setMetricType(e.target.value as WarehouseMetricType)} className="w-full h-11 block rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            {Object.entries(WAREHOUSE_METRIC_TYPE_MAP).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                        </select>
                    </div>
                    <SearchableSelect
                        label="Nhà sản xuất (tùy chọn)"
                        options={allManufacturers}
                        value={manufacturerName}
                        onChange={setManufacturerName}
                        placeholder="-- Tất cả --"
                    />
                    <div className="md:col-span-2">
                        <label htmlFor="productCodes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mã sản phẩm (tùy chọn)</label>
                        <textarea id="productCodes" value={productCodesInput} onChange={e => setProductCodesInput(e.target.value)} placeholder="Nhập mã nhóm hàng, cách nhau bằng dấu phẩy. Dùng khi 'Danh mục chính' không đủ chi tiết." rows={3} className="w-full block rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => resetForm()} className="flex-1 py-2 px-4 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors">Hủy</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                    <Icon name={editingColumn ? 'check-circle' : 'plus-circle'} size={4} />{editingColumn ? 'Cập nhật' : 'Thêm'}
                </button>
            </div>
        </form>
    );

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="Tùy Chỉnh Cột Báo Cáo" subTitle="Chọn, thêm hoặc tùy chỉnh các cột hiển thị trong báo cáo" titleColorClass="text-indigo-600 dark:text-indigo-400" maxWidthClass="max-w-5xl">
            <div className="p-6 flex flex-col max-h-[80vh] min-h-[60vh] bg-slate-50 dark:bg-slate-900">
                <div className="flex-grow overflow-y-auto">
                   {view === 'picker' ? renderPickerView() : renderFormView()}
                </div>
                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center flex-wrap gap-2">
                    <button onClick={handleRestoreDefaults} className="py-2 px-4 rounded-lg shadow-sm text-sm font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-800/60 transition-colors flex items-center gap-2"><Icon name="history" size={4} />Khôi phục mặc định</button>
                    <button onClick={handleSaveAndClose} className="py-2 px-6 rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Lưu & Đóng</button>
                </div>
            </div>
        </ModalWrapper>
    );
};

export default WarehouseSettingsModal;
