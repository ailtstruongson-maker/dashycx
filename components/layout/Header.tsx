
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../common/Icon';

interface HeaderProps {
    onNewFile: () => void;
    onLoadShiftFile: () => void;
    onClearDepartments: () => void;
    isClearingDepartments: boolean;
    hasDepartmentData: boolean;
    showNewFileButton: boolean;
    onClearData: () => void;
    fileInfo: { filename: string; savedAt: string } | null;
}

const Header: React.FC<HeaderProps> = ({ onNewFile, onLoadShiftFile, onClearDepartments, isClearingDepartments, hasDepartmentData, showNewFileButton, onClearData, fileInfo }) => {
    const [deptClearSuccess, setDeptClearSuccess] = useState(false);
    const [dataClearSuccess, setDataClearSuccess] = useState(false);
    const [isDeptInfoVisible, setIsDeptInfoVisible] = useState(false);
    const deptInfoRef = useRef<HTMLDivElement>(null);

    // Reset dataClearSuccess when a new file is loaded (fileInfo changes and is not null)
    useEffect(() => {
        if (fileInfo) {
            setDataClearSuccess(false);
        }
    }, [fileInfo]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (deptInfoRef.current && !deptInfoRef.current.contains(event.target as Node)) {
                setIsDeptInfoVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDeptClear = () => {
        onClearDepartments();
        setDeptClearSuccess(true);
        setTimeout(() => setDeptClearSuccess(false), 3000);
    };

    const handleDataClear = () => {
        setDataClearSuccess(true);
        setTimeout(() => {
            onClearData();
        }, 1500); // Delay to show message before parent component re-renders
    };
    
    const debugInfo = {
        title: {
            name: "Tiêu đề chính",
            description: "Tiêu đề chính của dashboard, cung cấp ngữ cảnh cho người dùng.",
            design: "Sử dụng thẻ h1, font chữ lớn và đậm để tạo điểm nhấn chính cho trang."
        },
        shiftFile: {
            name: "Nút Tải & Quản lý Phân ca",
            description: "Cho phép người dùng tải lên file Excel phân ca để ánh xạ mã nhân viên với bộ phận tương ứng. Dữ liệu này được lưu trữ cục bộ trong trình duyệt (IndexedDB) để sử dụng cho các lần sau. Nút này cũng cung cấp các hành động liên quan như truy cập trang phân ca hoặc xóa dữ liệu đã lưu.",
            design: "Một nhóm nút (button group) với các chức năng được phân chia rõ ràng: Tải file, Mở link, và Xóa. Sử dụng icon để tăng tính trực quan."
        },
        newFile: {
            name: "Nút Nhập & Xóa Dữ liệu Bán hàng",
            description: "Cho phép người dùng nhập một file dữ liệu bán hàng mới để thay thế dữ liệu hiện tại, hoặc xóa hoàn toàn dữ liệu bán hàng đã lưu trong trình duyệt để bắt đầu lại.",
            design: "Một nhóm nút với hai chức năng chính: 'Nhập file mới' (màu xanh dương) và 'Xóa' (màu đỏ) để thể hiện rõ ràng hành động của từng nút."
        }
    };
    
    return (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div data-debug-id="Header.Title" data-debug-info={JSON.stringify(debugInfo.title)}>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary-color)' }}>Dashboard</h1>
                 {fileInfo ? (
                     <p style={{ color: 'var(--text-secondary-color)' }} className="mt-1 text-sm">
                        Dữ liệu được cập nhật lúc: <strong className="text-slate-700 dark:text-slate-200">{fileInfo.savedAt}</strong>
                     </p>
                ) : (
                    <p style={{ color: 'var(--text-secondary-color)' }} className="mt-1">Dữ liệu được làm mới theo thời gian thực dựa trên tệp bạn cung cấp.</p>
                )}
            </div>
            <div className="flex items-center gap-4">
                {showNewFileButton && (
                    <>
                        <div className="flex items-center gap-1.5">
                            <div className="inline-flex rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" role="group" data-debug-id="Header.ShiftFileButton" data-debug-info={JSON.stringify(debugInfo.shiftFile)}>
                                <button 
                                    onClick={onLoadShiftFile}
                                    className="relative inline-flex items-center gap-2 rounded-l-lg bg-blue-100 dark:bg-blue-900/50 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 focus:z-10 transition-colors"
                                    title="Tải lên file phân ca của cụm"
                                >
                                    <Icon name="users-round" />
                                    <span className="hidden sm:inline">Tải phân ca</span>
                                </button>
                                <a 
                                    href="https://office.thegioididong.com/quan-ly-phan-ca" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`relative -ml-px inline-flex items-center bg-slate-100 dark:bg-slate-700 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 focus:z-10 transition-colors ${!hasDepartmentData || deptClearSuccess ? 'rounded-r-lg' : ''}`}
                                    title="Mở trang quản lý phân ca để tải file"
                                >
                                    <Icon name="link" />
                                </a>
                                {hasDepartmentData && (
                                     deptClearSuccess ? (
                                        <span className="relative -ml-px inline-flex items-center gap-1.5 rounded-r-lg bg-green-100 dark:bg-green-900/50 px-3 py-2 text-green-700 dark:text-green-300 text-sm font-semibold transition-all">
                                            <Icon name="check-circle" size={4} />
                                            Đã xóa
                                        </span>
                                     ) : (
                                        <button 
                                            onClick={handleDeptClear}
                                            disabled={isClearingDepartments}
                                            className="relative -ml-px inline-flex items-center rounded-r-lg bg-red-100 dark:bg-red-900/50 px-3 py-2 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 focus:z-10 disabled:bg-red-50 disabled:cursor-not-allowed transition-colors" 
                                            title="Xóa dữ liệu phân ca đã lưu trữ"
                                        >
                                            {isClearingDepartments ? (
                                                <Icon name="loader-2" className="animate-spin" />
                                            ) : (
                                                <Icon name="trash-2" />
                                            )}
                                        </button>
                                     )
                                )}
                            </div>
                             <div className="relative" ref={deptInfoRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsDeptInfoVisible(prev => !prev)}
                                    className="p-2 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    aria-label="Xem hướng dẫn phân theo bộ phận"
                                >
                                    <Icon name="info" size={4}/>
                                </button>
                                {isDeptInfoVisible && (
                                    <div className="absolute z-30 top-full right-0 mt-2 w-80 bg-slate-800 dark:bg-slate-900 text-white rounded-lg shadow-2xl p-4 border border-slate-700 animate-fade-in-up">
                                        <div className="absolute bottom-full right-4 w-0 h-0 border-x-[8px] border-x-transparent border-b-[8px] border-b-slate-800 dark:border-b-slate-900"></div>
                                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                                            <Icon name="info" size={4} className="text-blue-400"/>
                                            Hướng dẫn phân theo bộ phận
                                        </h4>
                                        <div className="text-sm space-y-2 text-slate-300">
                                            <p>Với dữ liệu YCX hiện tại chưa đủ dữ liệu để sắp xếp nhân viên theo bộ phận. Nếu bạn muốn xem hoặc sắp xếp doanh thu theo bộ phận, vui lòng nhập dữ liệu Phân ca tuần.</p>
                                            <p className="font-semibold text-slate-100">Cách thực hiện:</p>
                                            <ol className="list-decimal list-inside space-y-1">
                                                <li>Nhấn vào liên kết cạnh mục “Tải phân ca”.</li>
                                                <li>Chọn Siêu thị → Tuỳ chọn → Xuất Excel (xuất toàn bộ siêu thị trong cụm).</li>
                                                <li>Tải lên tất cả các file phân ca của cụm.</li>
                                            </ol>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="inline-flex rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" role="group" data-debug-id="Header.NewFileButton" data-debug-info={JSON.stringify(debugInfo.newFile)}>
                            <button 
                                id="new-file-btn" 
                                onClick={onNewFile}
                                className="flex items-center gap-2 rounded-l-lg bg-blue-100 dark:bg-blue-900/50 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 focus:z-10 transition-colors" 
                                title="Nhập file dữ liệu bán hàng mới (thay thế file hiện tại)"
                            >
                                <Icon name="file-plus-2" />
                                <span className="hidden sm:inline">Nhập YCX</span>
                            </button>
                             <a 
                                href="https://report.mwgroup.vn/home/dashboard/77" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="-ml-px inline-flex items-center bg-slate-100 dark:bg-slate-700 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 focus:z-10 transition-colors"
                                title="Mở trang báo cáo để tải file YCX"
                            >
                                <Icon name="link" />
                            </a>
                             {dataClearSuccess ? (
                                <span className="relative -ml-px inline-flex items-center gap-1.5 rounded-r-lg bg-green-100 dark:bg-green-900/50 px-3 py-2 text-green-700 dark:text-green-300 text-sm font-semibold transition-all">
                                    <Icon name="check-circle" size={4} />
                                    Đã xóa
                                </span>
                             ) : (
                                <button 
                                    onClick={handleDataClear}
                                    className="-ml-px flex items-center rounded-r-lg bg-red-100 dark:bg-red-900/50 px-3 py-2 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 focus:z-10 disabled:bg-red-50 disabled:cursor-not-allowed transition-colors" 
                                    title="Xóa dữ liệu bán hàng đã lưu và tải lại từ đầu"
                                >
                                    <Icon name="trash-2" />
                                </button>
                             )}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
