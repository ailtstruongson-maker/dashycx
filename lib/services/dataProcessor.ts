import { get } from 'svelte/store';
import { departmentMap, productConfig } from '../stores/dashboardStore';
import { calculateRowMetrics } from '../utils/calculationUtils';
import { summarizeKpis } from './kpiService';
import { summarizeEmployees } from './employeeService';
import type { DataRow, ProcessedData, TrendData, IndustryData } from '../types';

/**
 * Main engine for turning raw Excel JSON into a rich data model
 */
export function processDashboardData(rows: DataRow[]): ProcessedData {
  const dailyTrends: Record<string, { revenue: number, revenueQD: number, date: Date }> = {};
  const shifts: Record<string, { revenue: number, revenueQD: number }> = {
    "Ca 1": { revenue: 0, revenueQD: 0 },
    "Ca 2": { revenue: 0, revenueQD: 0 },
    "Ca 3": { revenue: 0, revenueQD: 0 },
    "Ca 4": { revenue: 0, revenueQD: 0 },
    "Ca 5": { revenue: 0, revenueQD: 0 },
    "Ca 6": { revenue: 0, revenueQD: 0 }
  };
  const industries: Record<string, IndustryData> = {};
  const unshipped: DataRow[] = [];
  
  // FIX: Added explicit cast to Record<string, string> to satisfy summarizeEmployees parameter requirement
  const currentDeptMap = get(departmentMap) as Record<string, string>;

  rows.forEach(row => {
    const metrics = calculateRowMetrics(row);
    
    // Attach computed metrics for later use
    row.computedRevenue = metrics.revenue;
    row.computedRevenueQD = metrics.revenueQD;

    // Track unshipped orders for KPI
    if ((row['Trạng thái xuất'] || '').toString().toLowerCase().includes('chưa')) {
      unshipped.push(row);
    }

    // Process Trends
    if (row.parsedDate) {
      const dateKey = row.parsedDate.toISOString().split('T')[0];
      if (!dailyTrends[dateKey]) {
        dailyTrends[dateKey] = { revenue: 0, revenueQD: 0, date: row.parsedDate };
      }
      dailyTrends[dateKey].revenue += metrics.revenue;
      dailyTrends[dateKey].revenueQD += metrics.revenueQD;

      const hour = row.parsedDate.getHours();
      const min = row.parsedDate.getMinutes();
      let shift = "";
      
      if (hour === 8) shift = "Ca 1";
      else if (hour >= 9 && hour < 12) shift = "Ca 2";
      else if (hour >= 12 && hour < 15) shift = "Ca 3";
      else if (hour >= 15 && hour < 18) shift = "Ca 4";
      else if (hour >= 18 && hour < 21) shift = "Ca 5";
      else if (hour === 21 && min < 30) shift = "Ca 6";

      if (shift && shifts[shift]) {
        shifts[shift].revenue += metrics.revenue;
        shifts[shift].revenueQD += metrics.revenueQD;
      }
    }

    // Aggregate by Industry
    const indName = row['Ngành hàng'] || 'Khác';
    if (!industries[indName]) {
      industries[indName] = { name: indName, revenue: 0, quantity: 0 };
    }
    industries[indName].revenue += metrics.revenue;
    industries[indName].quantity += (parseFloat(row['Số lượng']) || 1);
  });

  return {
    kpis: summarizeKpis(rows, unshipped),
    trendData: { daily: dailyTrends, shifts },
    industryData: Object.values(industries).sort((a, b) => b.revenue - a.revenue),
    employeeData: {
      fullSellerArray: summarizeEmployees(rows, currentDeptMap),
      averages: {}
    },
    unshippedOrders: unshipped,
    lastUpdated: new Date().toLocaleString('vi-VN'),
    reportSubTitle: "Tự động phân tích theo tiêu chuẩn BI 2.0"
  };
}
