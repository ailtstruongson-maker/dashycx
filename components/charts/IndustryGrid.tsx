
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { formatCurrency, formatQuantity } from '../../utils/dataUtils';
import { Icon } from '../common/Icon';
import { exportElementAsImage } from '../../services/uiService';
import { useDashboardContext } from '../../contexts/DashboardContext';
import { useIndustryGridLogic } from '../../hooks/useIndustryGridLogic';
import MultiSelectDropdown from '../common/MultiSelectDropdown';

declare const lucide: any;
declare const google: any;

interface IndustryGridProps {}

const IndustryGrid: React.FC<IndustryGridProps> = () => {
    const { processedData, productConfig } = useDashboardContext();
    const industryData = processedData?.industryData ?? [];
    const filteredValidSalesData = processedData?.filteredValidSalesData ?? [];

    const cardRef = useRef<HTMLDivElement>(null);
    const pieChartRef = useRef<HTMLDivElement>(null);
    const barChartRef = useRef<HTMLDivElement>(null);
    const isInitialFilterSet = useRef(false);

    const [isExporting, setIsExporting] = useState(false);
    const [activeTab, setActiveTab] = useState<'card' | 'chart'>('card');

    // Use Custom Hook to handle logic
    const {
        drilldownPath,
        setDrilldownPath,
        currentView,
        allSubgroups,
        selectedChartSubgroups,
        setSelectedChartSubgroups,
        manufacturerDataForChart,
        getTitle
    } = useIndustryGridLogic({ industryData, filteredValidSalesData, productConfig });

    // --- Effects & Handlers ---

    useEffect(() => {
        if (!isInitialFilterSet.current && allSubgroups.includes('Smartphone')) {
            setSelectedChartSubgroups(['Smartphone']);
            isInitialFilterSet.current = true;
        }
    }, [allSubgroups, setSelectedChartSubgroups]);

    useEffect(() => {
        if (lucide) lucide.createIcons();
    }, [currentView.data, activeTab]);

    const drawCharts = useCallback(() => {
        if (!(window as any).google?.visualization) return;
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#f1f5f9' : '#0f172a';
        
        // Draw Pie Chart
        if (pieChartRef.current && industryData.length > 0) {
            let pieChartData = [...industryData];
            if (industryData.length > 10) {
                const top10 = industryData.slice(0, 10);
                const otherSlice = industryData.slice(10).reduce((acc, item) => {
                    acc.revenue += item.revenue;
                    acc.quantity += item.quantity;
                    return acc;
                }, { revenue: 0, quantity: 0 });
                pieChartData = [...top10, { name: 'Ngành hàng khác', ...otherSlice }];
            }

            const pieData = new (window as any).google.visualization.DataTable();
            pieData.addColumn('string', 'Ngành hàng');
            pieData.addColumn('number', 'Doanh thu');
            pieData.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });

            pieData.addRows(pieChartData.map(item => {
                const legendLabel = `${item.name}: ${formatCurrency(item.revenue)} (${formatQuantity(item.quantity)} SP)`;
                const tooltip = `
                    <div class="p-2 shadow-lg rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-sans">
                        <div class="font-bold text-slate-800 dark:text-slate-100 mb-1">${item.name}</div>
                        <div class="text-slate-600 dark:text-slate-300">Doanh thu: <span class="font-bold text-indigo-600 dark:text-indigo-400">${formatCurrency(item.revenue)}</span></div>
                        <div class="text-slate-600 dark:text-slate-300">Số lượng: <span class="font-bold text-indigo-600 dark:text-indigo-400">${formatQuantity(item.quantity)} SP</span></div>
                    </div>`;
                return [legendLabel, item.revenue, tooltip];
            }));
            
            const pieOptions = {
                title: 'Top 10 Tỷ Trọng Doanh Thu',
                pieHole: 0.4,
                backgroundColor: 'transparent',
                colors: isDark 
                    ? ['#60a5fa', '#4ade80', '#facc15', '#f87171', '#a78bfa', '#22d3ee', '#fb923c', '#f472b6', '#34d399', '#93c5fd']
                    : ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#10b981', '#60a5fa'],
                legend: { 
                    position: 'right', 
                    alignment: 'center',
                    textStyle: { color: textColor, fontSize: 12 },
                    maxLines: 1
                },
                titleTextStyle: { color: textColor, fontSize: 16, bold: true },
                chartArea: { left: 10, top: 40, width: '95%', height: '85%' },
                tooltip: { isHtml: true }
            };
            const pieChart = new (window as any).google.visualization.PieChart(pieChartRef.current);
            pieChart.draw(pieData, pieOptions);
        }

        // Draw Bar Chart
        if (barChartRef.current && manufacturerDataForChart.length > 0) {
            const barChartColors = isDark 
                ? ['#a78bfa', '#7dd3fc', '#6ee7b7', '#fde047', '#f9a8d4', '#fda4af', '#fca5a5', '#d8b4fe', '#bfdbfe', '#a7f3d0', '#fef08a', '#fbcfe8', '#fed7aa', '#bae6fd', '#bbf7d0']
                : ['#818cf8', '#38bdf8', '#34d399', '#facc15', '#f472b6', '#fb7185', '#f87171', '#c084fc', '#93c5fd', '#6ee7b7', '#fde047', '#f9a8d4', '#fdba74', '#7dd3fc', '#86efac'];
            
            const barData = new (window as any).google.visualization.DataTable();
            barData.addColumn('string', 'Nhà sản xuất');
            barData.addColumn('number', 'Doanh thu');
            barData.addColumn({ type: 'string', role: 'style' });
            barData.addColumn({ type: 'string', role: 'annotation' });
            barData.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });

            const top15Manufacturers = manufacturerDataForChart.slice(0, 15);
            top15Manufacturers.forEach((item, index) => {
                const color = barChartColors[index % barChartColors.length];
                const annotation = `${formatCurrency(item.revenue)} | ${formatQuantity(item.quantity)} SP`;
                const tooltip = `
                    <div class="p-2 shadow-lg rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-sans">
                        <div class="font-bold text-slate-800 dark:text-slate-100 mb-1">${item.name}</div>
                        <div class="text-slate-600 dark:text-slate-300">Doanh thu: <span class="font-bold text-indigo-600 dark:text-indigo-400">${formatCurrency(item.revenue)}</span></div>
                        <div class="text-slate-600 dark:text-slate-300">Số lượng: <span class="font-bold text-indigo-600 dark:text-indigo-400">${formatQuantity(item.quantity)} SP</span></div>
                    </div>`;
                barData.addRow([item.name, item.revenue, `color: ${color}`, annotation, tooltip]);
            });

            let barChartTitle = 'Top 15 Nhà Sản Xuất (Tất cả)';
            if (selectedChartSubgroups.length === 1) {
                barChartTitle = `Top 15 Nhà Sản Xuất - ${selectedChartSubgroups[0]}`;
            } else if (selectedChartSubgroups.length > 1) {
                barChartTitle = `Top 15 Nhà Sản Xuất - ${selectedChartSubgroups.length} nhóm con`;
            }

            const barOptions = {
                title: barChartTitle,
                backgroundColor: 'transparent',
                legend: { position: 'none' },
                titleTextStyle: { color: textColor, fontSize: 16, bold: true },
                chartArea: { left: 120, top: 40, width: '70%', height: '80%' },
                hAxis: { textStyle: { color: textColor }, gridlines: { color: isDark ? '#334155' : '#e2e8f0' } },
                vAxis: { textStyle: { color: textColor } },
                animation: { startup: true, duration: 1000, easing: 'out' },
                tooltip: { isHtml: true },
                annotations: {
                    alwaysOutside: true,
                    textStyle: { fontSize: 10, color: textColor, auraColor: 'none' }
                }
            };
            const barChart = new (window as any).google.visualization.BarChart(barChartRef.current);
            barChart.draw(barData, barOptions);
        }
    }, [industryData, manufacturerDataForChart, selectedChartSubgroups]);

    useEffect(() => {
        let observer: ResizeObserver;
        const chartCardElement = cardRef.current;

        const drawAndObserve = () => {
             if ((window as any).google?.visualization) {
                drawCharts();
            } else {
                (window as any).google.charts.load('current', { 'packages': ['corechart'] });
                (window as any).google.charts.setOnLoadCallback(drawCharts);
            }
            
            if (chartCardElement) {
                observer = new ResizeObserver(() => {
                    setTimeout(() => drawCharts(), 150);
                });
                observer.observe(chartCardElement);
            }
        };

        if (activeTab === 'chart') {
            drawAndObserve();
        }

        return () => {
            if (observer && chartCardElement) observer.unobserve(chartCardElement);
        };
    }, [activeTab, drawCharts]);

    const handleExport = async () => {
        if (cardRef.current) {
            setIsExporting(true);
            await exportElementAsImage(cardRef.current, 'ty-trong-nganh-hang.png', {
                elementsToHide: ['.hide-on-export'],
            });
            setIsExporting(false);
        }
    };

    const handleCardClick = (itemName: string) => {
        if (drilldownPath.length < 2) {
            setDrilldownPath(prev => [...prev, itemName]);
        }
    };
    
    const handleBreadcrumbClick = (index: number) => {
        setDrilldownPath(prev => prev.slice(0, index));
    };

    return (
        <div className="chart-card p-6" ref={cardRef}>
            <div className="flex justify-between items-start mb-4">
                <div>
                     <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{getTitle(activeTab)}</h2>
                      {activeTab === 'card' && (
                        <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 hide-on-export">
                           <button onClick={() => handleBreadcrumbClick(0)} className="hover:text-indigo-600 dark:hover:text-indigo-400">All</button>
                           {drilldownPath.map((item, index) => (
                               <div key={index} className="flex items-center">
                                   <Icon name="chevron-right" size={4} className="mx-1" />
                                   <button onClick={() => handleBreadcrumbClick(index + 1)} className="hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[150px]">{item}</button>
                               </div>
                           ))}
                       </div>
                      )}
                </div>
                 <div className="flex items-center gap-2 hide-on-export">
                    {activeTab === 'chart' && (
                        <div className="flex items-center gap-2 w-64">
                             <MultiSelectDropdown 
                               options={allSubgroups}
                               selected={selectedChartSubgroups}
                               onChange={setSelectedChartSubgroups}
                               label="nhóm con"
                            />
                        </div>
                    )}
                    <div className="inline-flex rounded-lg shadow-sm p-1 bg-slate-100/50 dark:bg-slate-900/50">
                        <button onClick={() => setActiveTab('card')} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${activeTab === 'card' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>Thẻ</button>
                        <button onClick={() => setActiveTab('chart')} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${activeTab === 'chart' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>Biểu đồ</button>
                    </div>
                    <button onClick={handleExport} disabled={isExporting} title="Xuất Ảnh" className="p-2 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        {isExporting ? <Icon name="loader-2" className="animate-spin" /> : <Icon name="camera" />}
                    </button>
                 </div>
            </div>
            {activeTab === 'card' ? (
                currentView.data.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">Không có dữ liệu để hiển thị.</p>
                ) : (
                    <div className="grid gap-2 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 industry-cards-grid">
                        {currentView.data.map(({ name, revenue, quantity, icon, color }) => {
                            const percentage = currentView.totalRevenue > 0 ? (revenue / currentView.totalRevenue * 100) : 0;
                            const isDrillable = drilldownPath.length < 2;
                            return (
                                <div
                                    key={name}
                                    onClick={isDrillable ? () => handleCardClick(name) : undefined}
                                    className={`bg-white dark:bg-slate-800 px-2 py-1 rounded-xl text-center transition-all duration-300 ease-in-out transform border-2 border-${color}-200 dark:border-${color}-600 overflow-hidden relative group ${isDrillable ? `cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-${color}-500 dark:hover:border-${color}-400` : 'cursor-default'}`}
                                >
                                    <div className={`absolute -top-4 -right-4 w-12 h-12 bg-${color}-50 dark:bg-${color}-900/20 rounded-full transition-transform duration-500 group-hover:scale-[1.5]`}></div>
                                    <div className="relative z-10 flex flex-col justify-center h-full">
                                        <div className={`w-7 h-7 mx-auto rounded-full bg-${color}-100 dark:bg-${color}-900/50 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-0.5`}>
                                            <Icon name={icon} size={4} />
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate w-full" title={name}>{name}</p>
                                        <p className={`font-bold text-base text-${color}-600 dark:text-${color}-400`}>{formatCurrency(revenue)}</p>
                                        <div className="industry-card-footer mt-0.5">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                                {formatQuantity(quantity)} SP
                                                <span className={`ml-1 font-semibold text-${color}-500 dark:text-${color}-400`}>- {percentage.toFixed(1)}%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="flex flex-col lg:flex-row items-stretch gap-4">
                    <div className="lg:w-[45%]" ref={pieChartRef} style={{ minHeight: '450px' }}></div>
                    <div className="lg:w-[55%]" ref={barChartRef} style={{ minHeight: '450px' }}></div>
                </div>
            )}
        </div>
    );
};

export default IndustryGrid;
