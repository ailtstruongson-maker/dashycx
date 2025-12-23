
import React, { useEffect, useState } from 'react';
import DashboardView from './components/views/DashboardView';
import Sidebar from './components/layout/Sidebar';
// Import implemented view from TaxComponents to avoid casing conflict of filenames in the root views directory
import { TaxCalculatorView } from './components/views/tax/TaxComponents';
import CouponConverterView from './components/views/CouponConverterView';
import EmployeeEfficiencyView from './components/views/employee-efficiency/EmployeeEfficiencyView';
import DailyChecklistReportView from './components/views/DailyChecklistReportView';
import ReportBiUpdateView from './components/views/ReportBiUpdateView';
import type { ViewType } from './types';

declare const lucide: any;

export default function App() {
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (typeof lucide !== 'undefined' && lucide) {
            lucide.createIcons();
        }
    }, [currentView, isSidebarCollapsed]);

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView />;
            case 'tax':
                return <TaxCalculatorView />;
            case 'coupon':
                return <CouponConverterView />;
            case 'efficiency':
                return <EmployeeEfficiencyView />;
            case 'checklist':
                return <DailyChecklistReportView />;
            case 'bi_update':
                return <ReportBiUpdateView />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500 overflow-hidden">
            {/* Sidebar Navigation */}
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isMobileOpen={isMobileMenuOpen}
                setIsMobileOpen={setIsMobileMenuOpen}
            />

            {/* Main Application Area */}
            <main className={`flex-grow overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                            <i data-lucide="zap" className="w-5 h-5"></i>
                        </div>
                        <span className="font-black text-slate-800 dark:text-white tracking-tight uppercase">HUB 2.0</span>
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                        <i data-lucide="menu" className="w-6 h-6"></i>
                    </button>
                </div>

                <div className="w-full">
                    {renderView()}
                </div>
            </main>

            {/* Overlay for mobile sidebar */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}
        </div>
    );
}
