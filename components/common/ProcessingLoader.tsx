
import React from 'react';
import type { Status } from '../../types';

interface ProcessingLoaderProps {
    status: Status;
}

const ProcessingLoader: React.FC<ProcessingLoaderProps> = ({ status }) => {
    // Chúng ta loại bỏ hoàn toàn các tin nhắn mặc định chạy tự động.
    // Giao diện giờ đây chỉ hiển thị chính xác những gì hệ thống đang thực sự làm.

    return (
        <div className="modal-overlay fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex flex-col items-center justify-center p-4">
            <div className="modal-content w-full max-w-lg flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="pong-loader">
                    <div className="pong-ball" style={{ background: 'var(--text-primary-color)' }}></div>
                    <div className="pong-paddle left" style={{ background: 'var(--text-primary-color)' }}></div>
                    <div className="pong-paddle right" style={{ background: 'var(--text-primary-color)' }}></div>
                </div>
                
                {/* Hiển thị trực tiếp thông báo từ Worker */}
                <h2 className="mt-8 text-xl font-bold text-slate-800 dark:text-slate-100 text-center animate-pulse">
                    {status.message || "Đang khởi tạo..."}
                </h2>
                
                <div className="mt-6 w-full max-w-md">
                    <div className={`w-full rounded-full h-3 progress-bar-container scanner`}>
                        <div
                            className="bg-indigo-500 h-3 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${status.progress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>Tiến độ xử lý</span>
                        <span>{Math.round(status.progress)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessingLoader;
