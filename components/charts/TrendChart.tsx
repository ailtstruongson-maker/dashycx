
// Added a global declaration for the 'google' object to resolve TypeScript errors about 'google' not being found.
declare const google: any;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatCurrency } from '../../utils/dataUtils';
import { Icon } from '../common/Icon';
import { useDashboardContext } from '../../contexts/DashboardContext';
import { getTrendAnalysis } from '../../services/aiService';
import { useTrendChartLogic } from '../../hooks/useTrendChartLogic';

const TrendChart: React.FC = () => {
  const { processedData } = useDashboardContext();
  const trendData = processedData?.trendData;

  const chartDivRef = useRef<HTMLDivElement>(null);
  const chartCardRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [trendState, setTrendState] = useState({ view: 'shift', metric: 'thuc' });
  
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  // Use the custom hook to get prepared data
  const { totalValue, chartData, hasData, metricName } = useTrendChartLogic({
      trendData,
      view: trendState.view,
      metric: trendState.metric
  });
  
  const handleAiAnalysis = async () => {
    if (!trendData) return;
    setIsAnalysisLoading(true);
    setAnalysis(null); // Clear previous analysis
    try {
        const result = await getTrendAnalysis(trendData, trendState.view);
        setAnalysis(result);
    } catch (error) {
        setAnalysis("Đã xảy ra lỗi khi phân tích. Vui lòng thử lại.");
    } finally {
        setIsAnalysisLoading(false);
    }
  };

  const drawChart = useCallback(() => {
    if (!chartDivRef.current || !(window as any).google?.visualization) {
      if (chartDivRef.current) chartDivRef.current.innerHTML = ''; // Clear previous content
      return;
    }
    if (!trendData || !hasData) {
        chartDivRef.current.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-center text-slate-500 dark:text-slate-400">Không có dữ liệu xu hướng.</p></div>';
        return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f1f5f9' : '#0f172a';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const dailyBaseColor = isDark ? '#818cf8' : '#4f46e5';
    const chartAreaBg = isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc';
    const decreaseAnnotationColor = isDark ? '#f87171' : '#dc2626';

    const dataTable = new (window as any).google.visualization.DataTable();

    // Define columns based on view type
    if (trendState.view === 'daily') {
        dataTable.addColumn('date', 'Ngày');
        dataTable.addColumn('number', metricName);
        dataTable.addColumn({ type: 'string', role: 'annotation' });
        dataTable.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });
        dataTable.addRows(chartData);
    } else if (trendState.view === 'shift') {
        dataTable.addColumn('string', 'Ca');
        dataTable.addColumn('number', metricName);
        dataTable.addColumn({ type: 'string', role: 'style' });
        dataTable.addColumn({ type: 'string', role: 'annotation' });
        dataTable.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });
        dataTable.addRows(chartData);
    } else { // Weekly or Monthly
        dataTable.addColumn('string', trendState.view === 'weekly' ? 'Tuần' : 'Tháng');
        dataTable.addColumn('number', metricName); // Series 0: Increase/Same
        dataTable.addColumn({ type: 'string', role: 'style' });
        dataTable.addColumn({ type: 'string', role: 'annotation' });
        dataTable.addColumn('number', metricName); // Series 1: Decrease
        dataTable.addColumn({ type: 'string', role: 'style' });
        dataTable.addColumn({ type: 'string', role: 'annotation' });
        dataTable.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });
        dataTable.addRows(chartData);
    }

    const baseOptions = {
        backgroundColor: 'transparent',
        legend: { position: 'none' },
        chartArea: {
            width: '90%',
            height: '75%',
            left: 70,
            top: 40,
            backgroundColor: chartAreaBg
        },
        hAxis: {
            textStyle: { color: textColor, fontSize: 12 },
            gridlines: { color: 'transparent' },
            baselineColor: 'transparent',
            slantedText: trendState.view !== 'shift',
            slantedTextAngle: 30
        },
        vAxis: {
            textStyle: { color: textColor, fontSize: 12 },
            format: 'short',
            gridlines: { color: gridColor },
            minorGridlines: { count: 0 },
            viewWindow: { min: 0 },
            baselineColor: 'transparent',
        },
        tooltip: { isHtml: true, trigger: 'focus' },
        animation: {
            startup: true,
            duration: 1200,
            easing: 'out',
        },
    };

    let finalOptions;
    let ChartClass;

    if (trendState.view === 'daily') {
        ChartClass = (window as any).google.visualization.AreaChart;
        finalOptions = {
            ...baseOptions,
            hAxis: { ...baseOptions.hAxis, format: 'dd/MM' },
            lineWidth: 2,
            pointSize: 5,
            areaOpacity: 0.15,
            colors: [dailyBaseColor],
            crosshair: { trigger: 'both', orientation: 'vertical', color: gridColor },
            curveType: 'function',
            series: {
                0: {
                    color: dailyBaseColor,
                    pointShape: { type: 'circle' },
                    pointsVisible: true,
                }
            },
            annotations: {
                textStyle: { fontSize: 11, bold: false, color: textColor, auraColor: 'none' },
                stem: { color: 'transparent' },
                style: 'point'
            },
        };
    } else if (trendState.view === 'shift') {
        ChartClass = (window as any).google.visualization.ColumnChart;
        finalOptions = {
            ...baseOptions,
            bar: { groupWidth: '60%' },
            annotations: {
                textStyle: { fontSize: 12, bold: true, color: textColor, auraColor: 'none' },
                alwaysOutside: true,
            },
        };
    } else { // weekly or monthly
         ChartClass = (window as any).google.visualization.ColumnChart;
         finalOptions = {
            ...baseOptions,
            isStacked: true,
            bar: { groupWidth: '60%' },
            series: {
                0: { // Series 0 for Increase/Same
                    annotations: {
                        textStyle: { fontSize: 11, bold: true, color: textColor, auraColor: 'none' },
                        alwaysOutside: true,
                    }
                },
                1: { // Series 1 for Decrease
                    annotations: {
                        textStyle: { fontSize: 11, bold: true, color: decreaseAnnotationColor, auraColor: 'none' },
                        alwaysOutside: true,
                    }
                }
            }
        };
    }
    
    if (chartInstanceRef.current) {
        chartInstanceRef.current.clearChart();
    }
    chartInstanceRef.current = new ChartClass(chartDivRef.current);
    chartInstanceRef.current.draw(dataTable, finalOptions);
    
    // Update Title
    const titleEl = chartCardRef.current?.querySelector('#trend-chart-title');
    if(titleEl) {
        titleEl.innerHTML = `XU HƯỚNG DOANH THU <span class="text-slate-500 dark:text-slate-400 font-medium text-base ml-2"> - TỔNG: ${formatCurrency(totalValue)}</span>`;
    }

  }, [trendData, trendState, chartData, hasData, totalValue, metricName]);

  useEffect(() => {
    let observer: ResizeObserver;
    
    const drawAndObserve = () => {
        drawChart();
        if (chartCardRef.current) {
            observer = new ResizeObserver(() => {
                setTimeout(() => drawChart(), 150);
            });
            observer.observe(chartCardRef.current);
        }
    };

    if ((window as any).google?.visualization) {
        drawAndObserve();
    } else {
        (window as any).google?.charts?.load('current', { 'packages': ['corechart'] });
        (window as any).google?.charts?.setOnLoadCallback(drawAndObserve);
    }

    return () => {
        if (observer && chartCardRef.current) {
            observer.unobserve(chartCardRef.current);
        }
        if (chartInstanceRef.current) {
            chartInstanceRef.current.clearChart();
        }
    };
  }, [drawChart]);

  return (
    <div className="chart-card p-4" ref={chartCardRef}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 px-2">
            <div>
                 <h2 id="trend-chart-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">XU HƯỚNG DOANH THU</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tiêu chí: Tất cả | Xem theo: {trendState.view.charAt(0).toUpperCase() + trendState.view.slice(1)}</p>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0 hide-on-export">
                 <div className="inline-flex rounded-lg shadow-sm p-1 bg-slate-100/50 dark:bg-slate-900/50">
                    <button onClick={() => setTrendState(s => ({...s, metric: 'thuc'}))} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${trendState.metric === 'thuc' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>Thực</button>
                    <button onClick={() => setTrendState(s => ({...s, metric: 'qd'}))} className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-colors ${trendState.metric === 'qd' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>DTQĐ</button>
                </div>
                 <div className="inline-flex rounded-lg shadow-sm p-1 bg-slate-100/50 dark:bg-slate-900/50">
                    <button onClick={() => setTrendState(s => ({...s, view: 'shift'}))} className={`py-1.5 px-3 text-sm font-semibold rounded-md transition-colors ${trendState.view === 'shift' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>Ca</button>
                    <button onClick={() => setTrendState(s => ({...s, view: 'daily'}))} className={`py-1.5 px-3 text-sm font-semibold rounded-md transition-colors ${trendState.view === 'daily' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>Ngày</button>
                    <button onClick={() => setTrendState(s => ({...s, view: 'weekly'}))} className={`py-1.5 px-3 text-sm font-semibold rounded-md transition-colors ${trendState.view === 'weekly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>Tuần</button>
                    <button onClick={() => setTrendState(s => ({...s, view: 'monthly'}))} className={`py-1.5 px-3 text-sm font-semibold rounded-md transition-colors ${trendState.view === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'}`}>Tháng</button>
                </div>
                 <button
                    onClick={handleAiAnalysis}
                    disabled={isAnalysisLoading}
                    title="Phân tích xu hướng bằng AI"
                    className="p-2 rounded-lg shadow-sm text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isAnalysisLoading ? (
                        <Icon name="loader-2" className="animate-spin" />
                    ) : (
                        <Icon name="sparkles" />
                    )}
                </button>
            </div>
        </div>
        <div className="border-b border-slate-200 dark:border-slate-700 my-4"></div>
        <div ref={chartDivRef} style={{ width: '100%', height: '350px' }} />
        {(analysis || isAnalysisLoading) && (
            <div className="mt-4 p-4 bg-indigo-50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-900/50 rounded-lg">
                <h4 className="font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                    <Icon name="sparkles" />
                    AI Phân Tích Xu Hướng
                </h4>
                {isAnalysisLoading ? (
                    <div className="space-y-2 mt-1">
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
  );
};

export default TrendChart;
