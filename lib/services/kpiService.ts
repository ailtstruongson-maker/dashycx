
import type { DataRow, KpiData } from '../types';

/**
 * Tổng hợp toàn bộ chỉ số KPI từ danh sách đơn hàng đã lọc
 */
export function summarizeKpis(rows: DataRow[], unshippedRows: DataRow[]): KpiData {
  let totalRevenue = 0;
  let doanhThuQD = 0;
  let traGopValue = 0;
  let traGopCount = 0;
  let soLuongThuHo = 0;

  rows.forEach(row => {
    const hinhThucXuat = (row['Hình thức xuất'] || '').toString().toLowerCase();
    
    // Nếu là Thu hộ, chỉ đếm số lượng, không tính doanh thu
    if (hinhThucXuat.includes('thu hộ')) {
      soLuongThuHo++;
      return;
    }

    const rev = row.computedRevenue || 0;
    const revQD = row.computedRevenueQD || 0;

    totalRevenue += rev;
    doanhThuQD += revQD;

    if (hinhThucXuat.includes('trả góp')) {
      traGopValue += rev;
      traGopCount++;
    }
  });

  // Tính toán doanh thu chờ xuất (từ danh sách chưa xuất)
  const dtThucChoXuat = unshippedRows.reduce((sum, r) => sum + (r.computedRevenue || 0), 0);
  const dtQDChoXuat = unshippedRows.reduce((sum, r) => sum + (r.computedRevenueQD || 0), 0);

  return {
    totalRevenue,
    doanhThuQD,
    hieuQuaQD: totalRevenue > 0 ? (doanhThuQD - totalRevenue) / totalRevenue : 0,
    soLuongThuHo,
    traGopPercent: totalRevenue > 0 ? (traGopValue / totalRevenue) * 100 : 0,
    traGopValue,
    traGopCount,
    doanhThuThucChoXuat: dtThucChoXuat,
    doanhThuQDChoXuat: dtQDChoXuat
  };
}
