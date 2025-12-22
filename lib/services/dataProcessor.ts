
import { get } from 'svelte/store';
import { departmentMap } from '../stores/dashboardStore';
import { calculateRowMetrics } from '../utils/calculationUtils';
import { summarizeKpis } from './kpiService';
import { summarizeEmployees } from './employeeService';
import type { DataRow, ProcessedData, TrendData, IndustryData } from '../types';

export function processDashboardData(rows: DataRow[]): ProcessedData {
  const dailyTrends: Record<string, { revenue: number, revenueQD: number, date: Date }> = {};
  const shifts: Record<string, { revenue: number, revenueQD: number }> = {
    "Ca 1 (8h-11h)": { revenue: 0, revenueQD: 0 },
    "Ca 2 (11h-14h)": { revenue: 0, revenueQD: 0 },
    "Ca 3 (14h-17h)": { revenue: 0, revenueQD: 0 },
    "Ca 4 (17h-20h)": { revenue: 0, revenueQD: 0 },
    "Ca 5 (Sau 20h)": { revenue: 0, revenueQD: 0 }
  };
  const industries: Record<string, IndustryData> = {};
  const unshipped: DataRow[] = [];
  const currentDeptMap = get(departmentMap);

  const enrichedRows = rows.map(row => {
    const metrics = calculateRowMetrics(row);
    const enriched = { 
      ...row, 
      computedRevenue: metrics.revenue, 
      computedRevenueQD: metrics.revenueQD 
    };

    if ((row['Trạng thái xuất'] || '').toString().toLowerCase().includes('chưa')) {
      unshipped.push(enriched);
    }

    if (row.parsedDate) {
      const dateKey = row.parsedDate.toISOString().split('T')[0];
      if (!dailyTrends[dateKey]) {
        dailyTrends[dateKey] = { revenue: 0, revenueQD: 0, date: row.parsedDate };
      }
      dailyTrends[dateKey].revenue += metrics.revenue;
      dailyTrends[dateKey].revenueQD += metrics.revenueQD;

      const hour = row.parsedDate.getHours();
      let shiftKey = "Ca 5 (Sau 20h)";
      if (hour < 11) shiftKey = "Ca 1 (8h-11h)";
      else if (hour < 14) shiftKey = "Ca 2 (11h-14h)";
      else if (hour < 17) shiftKey = "Ca 3 (14h-17h)";
      else if (hour < 20) shiftKey = "Ca 4 (17h-20h)";
      shifts[shiftKey].revenue += metrics.revenue;
      shifts[shiftKey].revenueQD += metrics.revenueQD;
    }

    const nganhHang = row['Ngành hàng'] || 'Khác';
    if (!industries[nganhHang]) {
      industries[nganhHang] = { name: nganhHang, revenue: 0, quantity: 0 };
    }
    industries[nganhHang].revenue += metrics.revenue;
    industries[nganhHang].quantity += (parseFloat(row['Số lượng']) || 1);

    return enriched;
  });

  return {
    kpis: summarizeKpis(enrichedRows, unshipped),
    trendData: { daily: dailyTrends, shifts },
    industryData: Object.values(industries).sort((a, b) => b.revenue - a.revenue),
    employeeData: {
      fullSellerArray: summarizeEmployees(enrichedRows, currentDeptMap),
      averages: {}
    },
    unshippedOrders: unshipped,
    lastUpdated: new Date().toLocaleString('vi-VN'),
    reportSubTitle: "Dữ liệu được xử lý tự động theo hệ số quy đổi mới nhất."
  };
}
