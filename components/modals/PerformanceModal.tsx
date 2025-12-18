import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import type { Employee, DataRow, ProductConfig } from '../../types';
import ModalWrapper from './ModalWrapper';
import { Icon } from '../common/Icon';
import { getRowValue, formatCurrency, getHeSoQuyDoi, formatQuantity } from '../../utils/dataUtils';
import { COL } from '../../constants';
import { DashboardContext } from '../../contexts/DashboardContext';

// Added a global declaration for the 'google' object to resolve TypeScript errors about 'google' not being found.
declare const google: any;

interface PerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeName: string;
    onExport: (element: HTMLElement, filename: string, options?: any) => Promise<void>;
    isBatchExporting?: boolean;
    // Add props for batch export, as the component is rendered outside the context provider.
    fullSellerArray?: Employee[];
    validSalesData?: DataRow[];
    productConfig?: ProductConfig | null;
}

const KpiCard: React.FC<{ icon: string, label: string, value: string, color: string, children?: React.ReactNode }> = ({ icon, label, value, color, children }) => {
    return (
        <div className={`flex-1 p-4 bg-white dark:bg-slate-800 rounded-xl shadow border-l-4 border-${color}-500 flex flex-col justify-center gap-2`}>
            {/* Color mapping for JIT compiler */}
            {/* border-indigo-500 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 */}
            {/* border-green-500 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 */}
            {/* border-red-500 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 */}
            {/* border-amber-500 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 */}
            {/* border-purple-500 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 */}
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-${color}-100 dark:bg-${color}-900/50 flex items-center justify-center text-${color}-600 dark:text-${color}-400 flex-shrink-0`}>
                    <Icon name={icon} size={6} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                    <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
                </div>
            </div>
            {children && <div className="mt-2">{children}</div>}
        </div>
    );
};

const PerformanceModal: React.FC<PerformanceModalProps> = ({ 
    isOpen, 
    onClose, 
    employeeName, 
    onExport, 
    isBatchExporting = false,
    fullSellerArray: fullSellerArrayFromProps,
    validSalesData: validSalesDataFromProps,
    productConfig: productConfigFromProps
}) => {
    // Use React.useContext directly to allow the context to be undefined when batch exporting.
    const context = React.useContext(DashboardContext);

    // Prioritize props over context to support batch exporting outside of the provider.
    const fullSellerArray = fullSellerArrayFromProps ?? context?.employeeAnalysisData?.fullSellerArray ?? [];
    const validSalesData = validSalesDataFromProps ?? context?.processedData?.filteredValidSalesData ?? [];
    const productConfig = productConfigFromProps ?? context?.productConfig;

    const modalBodyRef = React.useRef<HTMLDivElement>(null);
    const pieChartRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportScale, setExportScale] = useState(2);
    const [isAllCustomersExpanded, setIsAllCustomersExpanded] = useState(false);
    const customerDetailsContainerRef = useRef<HTMLDivElement>(null);

    const employeeData = useMemo(() => {
        return fullSellerArray.find(emp => emp.name === employeeName);
    }, [fullSellerArray, employeeName]);

    const employeeSalesData = useMemo(() => {
        return validSalesData.filter(row => getRowValue(row, COL.NGUOI_TAO) === employeeName);
    }, [validSalesData, employeeName]);

    const { topProducts, industryBreakdown, customerBreakdown } = useMemo(() => {
        if (!productConfig) return { topProducts: [], industryBreakdown: {}, customerBreakdown: [] };

        const productSummary = employeeSalesData.reduce((acc, row) => {
            const productName = getRowValue(row, COL.PRODUCT) || 'N/A';
            const price = Number(getRowValue(row, COL.PRICE)) || 0;
            const quantity = Number(getRowValue(row, COL.QUANTITY)) || 0;
            const rowRevenue = price; // Doanh thu là giá trị của cột Giá bán_1
            if (!acc[productName]) acc[productName] = { revenue: 0, quantity: 0 };
            acc[productName].revenue += rowRevenue;
            acc[productName].quantity += quantity;
            return acc;
        }, {} as { [key: string]: { revenue: number, quantity: number } });

        const topProducts = Object.entries(productSummary)
            .map(([name, data]: [string, { revenue: number, quantity: number }]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const industryBreakdown = employeeSalesData.reduce((acc, row) => {
            const maNhomHang = getRowValue(row, COL.MA_NHOM_HANG);
            const parentGroup = productConfig.childToParentMap[maNhomHang] || 'Khác';
            const price = Number(getRowValue(row, COL.PRICE)) || 0;
            const rowRevenue = price; // Doanh thu là giá trị của cột Giá bán_1
            if (!acc[parentGroup]) acc[parentGroup] = 0;
            acc[parentGroup] += rowRevenue;
            return acc;
        }, {} as { [key: string]: number });

        const groupedByCustomer = employeeSalesData.reduce((acc, order) => {
            const customer = getRowValue(order, COL.CUSTOMER_NAME) || 'Khách lẻ';
            if (!acc[customer]) acc[customer] = [];
            acc[customer].push(order);
            return acc;
        }, {} as { [key: string]: DataRow[] });

        const customerBreakdown = Object.entries(groupedByCustomer).map(([customerName, orders]: [string, DataRow[]]) => {
            const { totalRevenue, totalRevenueQD } = orders.reduce((acc, o) => {
                const price = Number(getRowValue(o, COL.PRICE)) || 0;
                const rowRevenue = price; // Doanh thu là giá trị của cột Giá bán_1
                const maNganhHang = getRowValue(o, COL.MA_NGANH_HANG);
                const maNhomHang = getRowValue(o, COL.MA_NHOM_HANG);
                const heso = getHeSoQuyDoi(maNganhHang, maNhomHang, productConfig);
                acc.totalRevenue += rowRevenue;
                acc.totalRevenueQD += rowRevenue * heso;
                return acc;
            }, { totalRevenue: 0, totalRevenueQD: 0 });

            const hieuQuaQD = totalRevenue > 0 ? ((totalRevenueQD - totalRevenue) / totalRevenue) * 100 : 0;
            
            const firstOrder = orders[0];
            const scheduledDateRaw = getRowValue(firstOrder, ['TG Hẹn Giao']) || firstOrder.parsedDate;
            const scheduledDate = scheduledDateRaw instanceof Date ? scheduledDateRaw : new Date(scheduledDateRaw);
            const formattedScheduledDate = !isNaN(scheduledDate.getTime()) ? scheduledDate.toLocaleDateString('vi-VN', {day: 'numeric', month: 'numeric'}).replace(/\./g, '/') : 'N/A';
            
            // Calculate unshipped metrics
            const unshippedOrders = orders.filter(o => getRowValue(o, COL.XUAT) === 'Chưa xuất');
            const { totalRevenueUnshipped, totalRevenueQDUnshipped } = unshippedOrders.reduce((acc, o) => {
                 const price = Number(getRowValue(o, COL.PRICE)) || 0;
                 const rowRevenue = price; // Doanh thu là giá trị của cột Giá bán_1
                 const maNganhHang = getRowValue(o, COL.MA_NGANH_HANG);
                 const maNhomHang = getRowValue(o, COL.MA_NHOM_HANG);
                 const heso = getHeSoQuyDoi(maNganhHang, maNhomHang, productConfig);
                 acc.totalRevenueUnshipped += rowRevenue;
                 acc.totalRevenueQDUnshipped += rowRevenue * heso;
                 return acc;
            }, { totalRevenueUnshipped: 0, totalRevenueQDUnshipped: 0 });
            
            const hieuQuaQDUnshipped = totalRevenueUnshipped > 0 
                ? ((totalRevenueQDUnshipped - totalRevenueUnshipped) / totalRevenueUnshipped) * 100 
                : 0;

            return { 
                name: customerName, 
                orders, 
                totalRevenue,
                totalRevenueQD,
                hieuQuaQD,
                scheduledDate: formattedScheduledDate,
                totalRevenueQDUnshipped,
                hieuQuaQDUnshipped
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);
        
        return { topProducts, industryBreakdown, customerBreakdown };

    }, [employeeSalesData, productConfig]);

    const drawChart = useCallback(() => {
        if (!pieChartRef.current || !(window as any).google?.visualization || Object.keys(industryBreakdown).length === 0) {
            if (pieChartRef.current) pieChartRef.current.innerHTML = '<p class="text-center text-slate-500 dark:text-slate-400">Không có dữ liệu ngành hàng.</p>';
            return;
        }

        const dataTable = new (window as any).google.visualization.DataTable();
        dataTable.addColumn('string', 'Industry');
        dataTable.addColumn('number', 'Revenue');
        
        Object.entries(industryBreakdown).forEach(([industry, revenue]) => {
            dataTable.addRow([industry, revenue]);
        });
        
        const isDark = document.documentElement.classList.contains('dark');
        const options = {
            backgroundColor: 'transparent',
            chartArea: { width: '90%', height: '90%' },
            legend: { textStyle: { color: isDark ? '#f1f5f9' : '#0f172a' } },
            pieHole: 0.4,
            pieSliceTextStyle: { color: isDark ? '#1e293b' : '#ffffff' },
            tooltip: { text: 'value' }
        };

        const chart = new (window as any).google.visualization.PieChart(pieChartRef.current);
        chart.draw(dataTable, options);
    }, [industryBreakdown]);

    useEffect(() => {
        let observer: ResizeObserver;
        const chartContainer = pieChartRef.current;

        const drawAndObserve = () => {
            drawChart();
            if (chartContainer) {
                observer = new ResizeObserver(() => {
                    setTimeout(() => drawChart(), 150); // Debounce redraw
                });
                observer.observe(chartContainer);
            }
        };

        if (isOpen) {
            // Delay drawing to allow modal animation to complete
            const timer = setTimeout(() => {
                if ((window as any).google?.visualization) {
                    drawAndObserve();
                } else {
                    (window as any).google?.charts?.load('current', { 'packages': ['corechart'] });
                    (window as any).google?.charts?.setOnLoadCallback(drawAndObserve);
                }
            }, 350);

            return () => {
                clearTimeout(timer);
                if (observer && chartContainer) {
                    observer.unobserve(chartContainer);
                }
            };
        }
    }, [isOpen, drawChart]);

    
    const handleExport = async () => {
        const elementToExport = modalBodyRef.current?.closest('.modal-content') as HTMLElement | null;
        if (elementToExport) {
            setIsExporting(true);
            await onExport(elementToExport, `phan-tich-hieu-qua-${employeeName}.png`, { scale: exportScale, forceOpenDetails: true });
            setIsExporting(false);
        }
    };

    const toggleAllCustomers = () => {
        const nextState = !isAllCustomersExpanded;
        if (customerDetailsContainerRef.current) {
            const detailsElements = customerDetailsContainerRef.current.querySelectorAll('details');
            detailsElements.forEach(detail => {
                detail.open = nextState;
            });
        }
        setIsAllCustomersExpanded(nextState);
    };
    
    const controls = (
        <div className="flex items-center gap-2 hide-on-export">
            <select
                value={exportScale}
                onChange={(e) => setExportScale(Number(e.target.value))}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                aria-label="Chọn chất lượng ảnh xuất"
            >
                <option value={1}>Tiêu chuẩn (1x)</option>
                <option value={2}>Chất lượng cao (2x)</option>
                <option value={3}>Ultra HD (3x)</option>
            </select>
            <button onClick={handleExport} disabled={isExporting} title="Xuất Ảnh Phân Tích" className="p-2 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-[42px] h-[42px] border border-slate-300 dark:border-slate-600">
                 {isExporting ? <Icon name="loader-2" className="animate-spin" /> : <Icon name="camera" />}
            </button>
        </div>
    );
    
    const modalContent = !employeeData ? (
        <p>Không tìm thấy dữ liệu cho nhân viên này.</p>
    ) : (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="flex flex-col sm:flex-row gap-4">
                <KpiCard icon="dollar-sign" label="Tổng DTQĐ" value={formatCurrency(employeeData.doanhThuQD)} color="indigo" />
                <KpiCard icon="trending-up" label="Hiệu Quả QĐ" value={`${employeeData.hieuQuaValue.toFixed(0)}%`} color={employeeData.hieuQuaValue >= 40 ? 'green' : 'red'} />
                <KpiCard icon="clock" label="% T.Chậm" value={`${employeeData.traChamPercent.toFixed(0)}%`} color="amber" />
                <KpiCard icon="users" label="Tiếp Cận" value={formatQuantity(employeeData.slTiepCan)} color="purple">
                     <div className="text-xs flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span>Thu Hộ:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{formatQuantity(employeeData.slThuHo)}</span>
                    </div>
                </KpiCard>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2"><Icon name="award" size={5} className="text-amber-500"/> Top 5 Sản Phẩm Bán Chạy</h4>
                    <ul className="space-y-2">
                        {topProducts.map((p, i) => (
                            <li key={i} className="flex justify-between items-center text-sm p-2 rounded-md bg-slate-50 dark:bg-slate-700/50">
                                <div className="truncate pr-4">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={p.name}>{p.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatQuantity(p.quantity)} SP</p>
                                </div>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{formatCurrency(p.revenue)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Industry Breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2"><Icon name="pie-chart" size={5} className="text-teal-500"/> Tỷ Trọng Doanh Thu Ngành Hàng</h4>
                    <div ref={pieChartRef} style={{ width: '100%', height: '250px' }}></div>
                </div>
            </div>

             {/* Customer Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
                 <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Icon name="contact" size={5} className="text-sky-500"/> Chi Tiết Theo Khách Hàng
                    </span>
                    <button onClick={toggleAllCustomers} title={isAllCustomersExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'} className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-md transition-colors hide-on-export">
                        <Icon name={isAllCustomersExpanded ? "chevrons-up-down" : "chevrons-down-up"} size={4} />
                    </button>
                 </h4>
                 <div ref={customerDetailsContainerRef} className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {customerBreakdown.map(customer => (
                        <details key={customer.name} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
                             <summary className="p-3 cursor-pointer flex justify-between items-center list-none">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{customer.name.toUpperCase()}</p>
                                <div className="flex items-center gap-x-3 gap-y-1 flex-wrap justify-end text-xs font-semibold">
                                    <span className="text-slate-600 dark:text-slate-300">Hẹn giao: <span className="font-bold text-slate-800 dark:text-slate-100">{customer.scheduledDate}</span></span>
                                    <span className="text-slate-600 dark:text-slate-300">DT Thực: <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(customer.totalRevenue)}</span></span>
                                    <span className="text-slate-600 dark:text-slate-300">DTQĐ: <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(customer.totalRevenueQD)}</span></span>
                                    <span className="text-slate-600 dark:text-slate-300">HQQĐ: <span className={`font-bold ${customer.hieuQuaQD < 40 ? 'text-red-500' : 'text-green-500'}`}>{customer.hieuQuaQD.toFixed(0)}%</span></span>
                                    {customer.totalRevenueQDUnshipped > 0 && (
                                        <>
                                            <span className="text-slate-500 dark:text-slate-400">|</span>
                                            <span className="text-slate-600 dark:text-slate-300" title="Doanh thu quy đổi chưa xuất">
                                                DTQĐ C.Xuất: <span className="font-bold text-orange-500">{formatCurrency(customer.totalRevenueQDUnshipped)}</span>
                                            </span>
                                            <span className="text-slate-600 dark:text-slate-300" title="Hiệu quả quy đổi chưa xuất">
                                                HQQĐ C.Xuất: <span className={`font-bold ${customer.hieuQuaQDUnshipped < 40 ? 'text-red-500' : 'text-green-500'}`}>{customer.hieuQuaQDUnshipped.toFixed(0)}%</span>
                                            </span>
                                        </>
                                    )}
                                    <div className="accordion-icon text-slate-400 transition-transform duration-300 hide-on-export ml-2">
                                        <Icon name="chevron-down" />
                                    </div>
                                </div>
                             </summary>
                              <div className="border-t border-slate-200 dark:border-slate-700">
                                 <table className="w-full text-sm table-auto compact-export-table">
                                     <thead className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                                         <tr>
                                             <th className="p-2 text-left font-semibold w-28">Mã ĐH</th>
                                             <th className="p-2 text-left font-semibold">Sản phẩm</th>
                                             <th className="p-2 text-center font-semibold w-12">SL</th>
                                             <th className="p-2 text-right font-semibold whitespace-nowrap">Doanh Thu</th>
                                             <th className="p-2 text-center font-semibold w-24">Trạng Thái</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {customer.orders.filter(order => (Number(getRowValue(order, COL.PRICE)) || 0) > 0).map((order, index) => {
                                            const orderId = getRowValue(order, COL.ID);
                                            const exportStatus = getRowValue(order, COL.XUAT);
                                            const isUnshipped = exportStatus === 'Chưa xuất';
                                            const price = Number(getRowValue(order, COL.PRICE)) || 0;
                                            const rowRevenue = price; // Doanh thu là giá trị của cột Giá bán_1
                                            return (
                                                <tr key={orderId || index} className="border-t border-slate-100 dark:border-slate-700/50">
                                                    <td className="p-2 text-left text-xs text-slate-500 dark:text-slate-400">{orderId}</td>
                                                    <td className="p-2 text-left text-slate-800 dark:text-slate-200 allow-wrap">{getRowValue(order, COL.PRODUCT)}</td>
                                                    <td className="p-2 text-center text-slate-600 dark:text-slate-300">{formatQuantity(getRowValue(order, COL.QUANTITY) as number)}</td>
                                                    <td className="p-2 text-right font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{formatCurrency(rowRevenue)}</td>
                                                    <td className="p-2 text-center text-xs">
                                                        {isUnshipped ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                                                                Chưa xuất
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                                                Đã xuất
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                         })}
                                     </tbody>
                                 </table>
                              </div>
                        </details>
                    ))}
                 </div>
            </div>
        </div>
    );
    
    // If we are batch exporting, we don't render the full modal wrapper, just the content
    if (isBatchExporting) {
        // This is a simplified render path for off-screen capturing
        return (
            <div className="modal-content bg-slate-50 dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Phân Tích Hiệu Quả Cá Nhân</p>
                        <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{employeeName}</h3>
                    </div>
                </div>
                <div className="p-6 bg-slate-100 dark:bg-slate-950">
                   {modalContent}
                </div>
            </div>
        );
    }


    return (
        <ModalWrapper 
            isOpen={isOpen} 
            onClose={onClose} 
            title={employeeName} 
            subTitle="Phân Tích Hiệu Quả Cá Nhân"
            titleColorClass="text-indigo-600 dark:text-indigo-400"
            controls={controls}
            maxWidthClass="max-w-4xl"
        >
            <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950" ref={modalBodyRef}>
                {modalContent}
            </div>
        </ModalWrapper>
    );
};

export default PerformanceModal;