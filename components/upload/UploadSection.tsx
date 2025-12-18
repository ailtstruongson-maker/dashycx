
import React, { useState, useCallback } from 'react';
import { Icon } from '../common/Icon';

interface UploadSectionProps {
    onProcessFile: (file: File) => void;
    configUrl: string;
    onConfigUrlChange: (url: string) => void;
    isDeduplicationEnabled?: boolean;
    onDeduplicationChange?: (enabled: boolean) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onProcessFile, configUrl, onConfigUrlChange, isDeduplicationEnabled = false, onDeduplicationChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onProcessFile(files[0]);
        }
    }, [onProcessFile]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onProcessFile(e.target.files[0]);
        }
    }, [onProcessFile]);

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Icon name="upload-cloud" size={5} className="text-indigo-500" />
                        Tải lên dữ liệu
                    </h2>
                    <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                        title="Cài đặt cấu hình"
                    >
                        <Icon name="settings" size={4} />
                    </button>
                </div>
                
                <label
                    htmlFor="file-upload"
                    className={`drop-zone flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <div className={`p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-3 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                            <Icon name="file-spreadsheet" size={8} />
                        </div>
                        <p className="mb-1 text-sm text-slate-600 dark:text-slate-300 font-semibold">
                            <span className="text-indigo-600 dark:text-indigo-400 hover:underline">Chọn file</span> hoặc kéo thả vào đây
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Hỗ trợ định dạng: .XLSX, .XLS
                        </p>
                        <p className="mt-2 text-xs text-slate-400 italic">
                            * Lưu ý: Hệ thống chỉ chấp nhận định dạng file .xlsx hoặc .xls
                        </p>
                    </div>
                </label>
            </div>
            
            {isSettingsOpen && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in-down space-y-4">
                    <div>
                        <label htmlFor="config-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            URL Cấu hình Sản phẩm (Google Sheets CSV)
                        </label>
                        <input
                            type="text"
                            id="config-url"
                            value={configUrl}
                            onChange={(e) => onConfigUrlChange(e.target.value)}
                            className="w-full p-2.5 text-sm text-slate-900 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://docs.google.com/..."
                        />
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Link này dùng để tải cấu hình nhóm hàng, ngành hàng. Đảm bảo link công khai và có định dạng CSV.
                        </p>
                    </div>
                    {onDeduplicationChange && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div>
                                <label htmlFor="dedupe-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Xóa dữ liệu trùng lặp
                                </label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Tự động tìm và xóa các dòng dữ liệu giống hệt nhau khi nhập file.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="dedupe-toggle"
                                    className="sr-only peer" 
                                    checked={isDeduplicationEnabled}
                                    onChange={(e) => onDeduplicationChange(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UploadSection;
