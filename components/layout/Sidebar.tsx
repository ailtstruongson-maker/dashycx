
import React from 'react';
import { Icon } from '../common/Icon';
import type { ViewType } from '../../types';

interface SidebarProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    setCurrentView, 
    isCollapsed, 
    setIsCollapsed,
    isMobileOpen,
    setIsMobileOpen
}) => {
    const menuItems: { id: ViewType; label: string; icon: string; color: string }[] = [
        { id: 'dashboard', label: 'Báo Cáo YCX', icon: 'layout-dashboard', color: 'indigo' },
        { id: 'bi_update', label: 'Cập nhật BI', icon: 'refresh-cw', color: 'sky' },
        { id: 'tax', label: 'Tính Thuế TNCN', icon: 'calculator', color: 'rose' },
        { id: 'coupon', label: 'Đổi Coupon', icon: 'ticket', color: 'amber' },
        { id: 'efficiency', label: 'Thi Đua & Hiệu Suất', icon: 'trending-up', color: 'emerald' },
        { id: 'checklist', label: 'Daily Checklist', icon: 'clipboard-check', color: 'violet' }
    ];

    const handleMenuClick = (id: ViewType) => {
        setCurrentView(id);
        setIsMobileOpen(false);
    };

    return (
        <aside 
            className={`fixed left-0 top-0 h-full z-[100] transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col shadow-2xl
                ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-20' : 'md:w-64'}
            `}
        >
            {/* Header / Logo */}
            <div className={`flex items-center gap-3 p-6 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="shrink-0 p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
                    <Icon name="zap" size={6} />
                </div>
                {(!isCollapsed || isMobileOpen) && (
                    <div className="overflow-hidden">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">HUB <span className="text-indigo-600">2.0</span></h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">BI Analyst</p>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-grow px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-200 group relative
                            ${currentView === item.id 
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none font-bold' 
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 font-medium'
                            }
                        `}
                    >
                        <div className={`shrink-0 transition-colors ${currentView === item.id ? 'text-white' : `text-${item.color}-500`}`}>
                            <Icon name={item.icon} size={5} />
                        </div>
                        
                        {(!isCollapsed || isMobileOpen) && (
                            <span className="text-sm whitespace-nowrap">{item.label}</span>
                        )}

                        {currentView === item.id && !isCollapsed && (
                            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white opacity-60"></div>
                        )}

                        {/* Tooltip for collapsed view */}
                        {isCollapsed && !isMobileOpen && (
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                                {item.label}
                                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                            </div>
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer / Toggle Button */}
            <div className="p-4 space-y-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex w-full items-center gap-4 p-3 rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                >
                    <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} size={5} />
                    {!isCollapsed && <span className="text-sm font-bold">Thu gọn menu</span>}
                </button>

                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-3 py-2'}`}>
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                        <Icon name="user" size={5} className="text-slate-400" />
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                        <div className="overflow-hidden">
                            <p className="text-xs font-black text-slate-800 dark:text-white truncate uppercase">Admin Hub</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Bi Analyst 2025</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Close Button */}
            {isMobileOpen && (
                <button 
                    onClick={() => setIsMobileOpen(false)}
                    className="absolute top-4 right-4 md:hidden p-2 text-slate-400 hover:text-slate-800"
                >
                    <Icon name="x" size={6} />
                </button>
            )}
        </aside>
    );
};

export default Sidebar;
