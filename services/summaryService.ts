
import type { DataRow, ProductConfig, FilterState, SummaryTableNode, GrandTotal, WarehouseSummaryRow, MetricValues } from '../types';
import { COL, HINH_THUC_XUAT_THU_HO, HINH_THUC_XUAT_TRA_GOP } from '../constants';
import { getRowValue, getHeSoQuyDoi, sortSummaryData, getHinhThucThanhToan, getDisplayParentGroup, abbreviateName } from '../utils/dataUtils';

export function processSummaryTable(
    filteredValidSalesData: DataRow[],
    productConfig: ProductConfig,
    filters: FilterState
): {
    data: { [key: string]: SummaryTableNode };
    grandTotal: GrandTotal;
    uniqueParentGroups: string[];
    uniqueChildGroups: string[];
    uniqueManufacturers: string[];
    uniqueCreators: string[];
    uniqueProducts: string[];
} {
    const summaryTableData: { [key: string]: SummaryTableNode } = {};
    
    // Sets to collect unique values for dropdowns
    const parentGroupsForFilter = new Set<string>();
    const childGroupsForFilter = new Set<string>();
    const manufacturersForFilter = new Set<string>();
    const creatorsForFilter = new Set<string>();
    const productsForFilter = new Set<string>();

    // Mapping key codes to data extraction logic
    const valueExtractors: { [key: string]: (row: DataRow) => string } = {
        'parent': (row) => productConfig.childToParentMap[getRowValue(row, COL.MA_NHOM_HANG)] || 'Không xác định',
        'child': (row) => productConfig.childToSubgroupMap[getRowValue(row, COL.MA_NHOM_HANG)] || 'Không xác định',
        'manufacturer': (row) => getRowValue(row, COL.MANUFACTURER) || 'Không rõ',
        'creator': (row) => abbreviateName(getRowValue(row, COL.NGUOI_TAO) || 'Không xác định'), // Apply abbreviation here
        'product': (row) => getRowValue(row, COL.PRODUCT) || 'Sản phẩm lỗi tên'
    };

    // Ensure we have a valid drilldown order, defaulting if empty
    const drilldownOrder = (filters.summaryTable.drilldownOrder && filters.summaryTable.drilldownOrder.length > 0)
        ? filters.summaryTable.drilldownOrder
        : ['parent', 'child', 'manufacturer', 'creator', 'product'];

    filteredValidSalesData.forEach(row => {
        // Extract values for all dimensions
        const parentVal = valueExtractors['parent'](row);
        const childVal = valueExtractors['child'](row);
        const manufacturerVal = valueExtractors['manufacturer'](row);
        const creatorVal = valueExtractors['creator'](row);
        const productVal = valueExtractors['product'](row);

        // Collect unique values for UI filters
        parentGroupsForFilter.add(parentVal);
        childGroupsForFilter.add(childVal);
        manufacturersForFilter.add(manufacturerVal);
        creatorsForFilter.add(creatorVal);
        productsForFilter.add(productVal);

        // --- Apply Filters ---
        // If a filter array is not empty, and the current value is NOT in it, skip this row.
        if (filters.summaryTable.parent.length > 0 && !filters.summaryTable.parent.includes(parentVal)) return;
        if (filters.summaryTable.child.length > 0 && !filters.summaryTable.child.includes(childVal)) return;
        if (filters.summaryTable.manufacturer && filters.summaryTable.manufacturer.length > 0 && !filters.summaryTable.manufacturer.includes(manufacturerVal)) return;
        if (filters.summaryTable.creator && filters.summaryTable.creator.length > 0 && !filters.summaryTable.creator.includes(creatorVal)) return;
        if (filters.summaryTable.product && filters.summaryTable.product.length > 0 && !filters.summaryTable.product.includes(productVal)) return;

        // --- Calculation ---
        const quantity = Number(getRowValue(row, COL.QUANTITY)) || 0;
        const price = Number(getRowValue(row, COL.PRICE)) || 0;
        const revenue = price; // Revenue is 'Giá bán_1'
        const maNganhHang = getRowValue(row, COL.MA_NGANH_HANG);
        const maNhomHang = getRowValue(row, COL.MA_NHOM_HANG);
        const heso = getHeSoQuyDoi(maNganhHang, maNhomHang, productConfig);
        const revenueQD = revenue * heso;
        
        // Build the dynamic key path based on drilldownOrder
        const keys: string[] = [];
        for (const levelKey of drilldownOrder) {
            if (valueExtractors[levelKey]) {
                keys.push(valueExtractors[levelKey](row));
            }
        }

        // Construct the tree
        let currentNode: { [key: string]: SummaryTableNode } | undefined = summaryTableData;
        keys.forEach(key => {
            if (!currentNode) return;
            if (!currentNode[key]) {
                currentNode[key] = { 
                    totalQuantity: 0, 
                    totalRevenue: 0, 
                    totalTraGop: 0, 
                    totalRevenueQD: 0, 
                    children: {} 
                };
            }
            currentNode[key].totalQuantity += quantity;
            currentNode[key].totalRevenue += revenue;
            currentNode[key].totalRevenueQD += revenueQD;
            if (getHinhThucThanhToan(row) === 'tra_gop') {
                currentNode[key].totalTraGop += revenue;
            }
            currentNode = currentNode[key].children;
        });
    });

    const grandTotal: GrandTotal = Object.values(summaryTableData).reduce((acc, node) => {
        acc.totalQuantity += node.totalQuantity;
        acc.totalRevenue += node.totalRevenue;
        acc.totalRevenueQD += node.totalRevenueQD;
        acc.totalTraGop += node.totalTraGop;
        return acc;
    }, { totalQuantity: 0, totalRevenue: 0, totalRevenueQD: 0, totalTraGop: 0, aov: 0, traGopPercent: 0 });

    grandTotal.aov = grandTotal.totalQuantity > 0 ? grandTotal.totalRevenue / grandTotal.totalQuantity : 0;
    grandTotal.traGopPercent = grandTotal.totalRevenue > 0 ? (grandTotal.totalTraGop / grandTotal.totalRevenue) * 100 : 0;

    const sortedSummaryTableData = sortSummaryData(summaryTableData, filters.summaryTable.sort.column, filters.summaryTable.sort.direction);

    return {
        data: sortedSummaryTableData,
        grandTotal,
        uniqueParentGroups: [...parentGroupsForFilter].sort(),
        uniqueChildGroups: [...childGroupsForFilter].sort(),
        uniqueManufacturers: [...manufacturersForFilter].sort(),
        uniqueCreators: [...creatorsForFilter].sort(),
        uniqueProducts: [...productsForFilter].sort()
    };
}


/**
 * Calculates a summary of metrics for each warehouse.
 * Refactored to compute dynamic metrics by industry and group.
 */
export function calculateWarehouseSummary(
    allData: DataRow[],
    filters: FilterState,
    productConfig: ProductConfig
): WarehouseSummaryRow[] | null {
    const mainStartDate = filters.startDate ? new Date(filters.startDate) : null;
    if (mainStartDate) mainStartDate.setHours(0, 0, 0, 0);
    const mainEndDate = filters.endDate ? new Date(filters.endDate) : null;
    if (mainEndDate) mainEndDate.setHours(23, 59, 59, 999);

    const dataForWarehouseSummary = allData.filter(row => {
        const rowDate = row.parsedDate;
        if (!((!mainStartDate || rowDate >= mainStartDate) && (!mainEndDate || rowDate <= mainEndDate))) return false;
        if (filters.xuat !== 'all') {
            const xuatValue = getRowValue(row, COL.XUAT) || '';
            const xuatStatus = xuatValue.toLowerCase().includes('đã') ? 'Đã' : 'Chưa';
            if (xuatStatus !== filters.xuat) return false;
        }
        if (filters.trangThai.length > 0 && !filters.trangThai.includes(getRowValue(row, COL.TRANG_THAI))) return false;
        return true;
    });

    const uniqueKhos = [...new Set(allData.map(r => getRowValue(r, COL.KHO)).filter(Boolean))];
    if (uniqueKhos.length <= 1) return null;

    const summaryByKho: { [key: string]: any } = {};
    uniqueKhos.forEach(kho => {
        summaryByKho[kho] = {
            customers: new Set<string>(),
            doanhThuTraCham: 0,
            slThuHo: 0,
            metrics: {
                byIndustry: {},
                byGroup: {},
                byManufacturer: {},
                byIndustryAndManufacturer: {},
                byGroupAndManufacturer: {},
            },
        };
    });
    
    const initMetricValues = (): MetricValues => ({ quantity: 0, revenue: 0, revenueQD: 0 });

    dataForWarehouseSummary.forEach(row => {
        const khoName = getRowValue(row, COL.KHO);
        if (!khoName || !summaryByKho[khoName]) return;
        
        const summary = summaryByKho[khoName];

        if (HINH_THUC_XUAT_THU_HO.has(getRowValue(row, COL.HINH_THUC_XUAT))) {
            summary.slThuHo++;
        }

        if (!HINH_THUC_XUAT_THU_HO.has(getRowValue(row, COL.HINH_THUC_XUAT))) {
            const price = Number(getRowValue(row, COL.PRICE)) || 0;
            const quantity = Number(getRowValue(row, COL.QUANTITY)) || 0;
            const maNganhHang = getRowValue(row, COL.MA_NGANH_HANG);
            const maNhomHang = getRowValue(row, COL.MA_NHOM_HANG);
            const customer = getRowValue(row, COL.CUSTOMER_NAME);
            const heso = getHeSoQuyDoi(maNganhHang, maNhomHang, productConfig);
            const rowRevenue = price; // Doanh thu là giá trị của cột Giá bán_1
            const rowRevenueQD = rowRevenue * heso;

            if (customer) summary.customers.add(customer);
            if (HINH_THUC_XUAT_TRA_GOP.has(getRowValue(row, COL.HINH_THUC_XUAT))) {
                summary.doanhThuTraCham += rowRevenue;
            }
            
            const industry = productConfig.childToParentMap[maNhomHang] || 'Khác';
            const group = productConfig.childToSubgroupMap[maNhomHang] || 'Khác';
            const manufacturer = getRowValue(row, COL.MANUFACTURER) || 'Không rõ';

            // Aggregate by industry
            if (!summary.metrics.byIndustry[industry]) summary.metrics.byIndustry[industry] = initMetricValues();
            summary.metrics.byIndustry[industry].quantity += quantity;
            summary.metrics.byIndustry[industry].revenue += rowRevenue;
            summary.metrics.byIndustry[industry].revenueQD += rowRevenueQD;

            // Aggregate by group
            if (!summary.metrics.byGroup[group]) summary.metrics.byGroup[group] = initMetricValues();
            summary.metrics.byGroup[group].quantity += quantity;
            summary.metrics.byGroup[group].revenue += rowRevenue;
            summary.metrics.byGroup[group].revenueQD += rowRevenueQD;

            // Aggregate by manufacturer
            if (!summary.metrics.byManufacturer[manufacturer]) summary.metrics.byManufacturer[manufacturer] = initMetricValues();
            summary.metrics.byManufacturer[manufacturer].quantity += quantity;
            summary.metrics.byManufacturer[manufacturer].revenue += rowRevenue;
            summary.metrics.byManufacturer[manufacturer].revenueQD += rowRevenueQD;

            // Aggregate by industry and manufacturer
            if (!summary.metrics.byIndustryAndManufacturer[industry]) summary.metrics.byIndustryAndManufacturer[industry] = {};
            if (!summary.metrics.byIndustryAndManufacturer[industry][manufacturer]) summary.metrics.byIndustryAndManufacturer[industry][manufacturer] = initMetricValues();
            summary.metrics.byIndustryAndManufacturer[industry][manufacturer].quantity += quantity;
            summary.metrics.byIndustryAndManufacturer[industry][manufacturer].revenue += rowRevenue;
            summary.metrics.byIndustryAndManufacturer[industry][manufacturer].revenueQD += rowRevenueQD;

            // Aggregate by group and manufacturer
            if (!summary.metrics.byGroupAndManufacturer[group]) summary.metrics.byGroupAndManufacturer[group] = {};
            if (!summary.metrics.byGroupAndManufacturer[group][manufacturer]) summary.metrics.byGroupAndManufacturer[group][manufacturer] = initMetricValues();
            summary.metrics.byGroupAndManufacturer[group][manufacturer].quantity += quantity;
            summary.metrics.byGroupAndManufacturer[group][manufacturer].revenue += rowRevenue;
            summary.metrics.byGroupAndManufacturer[group][manufacturer].revenueQD += rowRevenueQD;
        }
    });

    return uniqueKhos
        .filter(kho => summaryByKho[kho])
        .map(khoName => {
            const summary = summaryByKho[khoName];
            
            // Calculate top-level aggregates from the dynamic metrics
            const totalMetrics = Object.values(summary.metrics.byIndustry as Record<string, MetricValues>)
                .reduce((acc, metric) => {
                    acc.revenue += metric.revenue;
                    acc.revenueQD += metric.revenueQD;
                    return acc;
                }, { revenue: 0, revenueQD: 0 });
            
            const doanhThuThuc = totalMetrics.revenue;
            const doanhThuQD = totalMetrics.revenueQD;
            const hieuQuaQD = doanhThuThuc > 0 ? ((doanhThuQD - doanhThuThuc) / doanhThuThuc) * 100 : 0;
            const traChamPercent = doanhThuThuc > 0 ? (summary.doanhThuTraCham / doanhThuThuc) * 100 : 0;
            
            return {
                khoName,
                doanhThuThuc,
                doanhThuQD,
                hieuQuaQD,
                slTiepCan: summary.customers.size,
                slThuHo: summary.slThuHo,
                traChamPercent: traChamPercent,
                doanhThuTraCham: summary.doanhThuTraCham,
                metrics: summary.metrics,
            };
        })
        .sort((a,b) => b.doanhThuQD - a.doanhThuQD);
}
