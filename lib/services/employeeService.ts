
import type { DataRow, Employee, ProductConfig } from '../types';
import { getConversionFactor } from '../utils/calculationUtils';

/**
 * Tổng hợp dữ liệu từ danh sách đơn hàng thành mảng nhân viên
 */
export function summarizeEmployees(rows: DataRow[], deptMap: Record<string, string>): Employee[] {
  const empMap: Record<string, any> = {};

  rows.forEach(row => {
    const name = row.normalizedNguoiTao || 'Không tên';
    const rev = row.computedRevenue || 0;
    const revQD = row.computedRevenueQD || 0;
    const hinhThucXuat = (row['Hình thức xuất'] || '').toString().toLowerCase();
    const industry = (row['Ngành hàng'] || '').toString().toLowerCase();

    if (!empMap[name]) {
      // Lấy ID từ tên (VD: "12345 - Nguyễn Văn A")
      const id = name.split(' - ')[0];
      empMap[name] = {
        name,
        department: deptMap[id] || 'Chưa phân ca',
        doanhThuThuc: 0,
        doanhThuQD: 0,
        slTraGop: 0,
        totalOrders: 0,
        slTiepCan: new Set(), // Dùng Set để đếm số khách hàng duy nhất
      };
    }

    const emp = empMap[name];
    
    // Chỉ tính doanh thu nếu không phải thu hộ
    if (!hinhThucXuat.includes('thu hộ')) {
      emp.doanhThuThuc += rev;
      emp.doanhThuQD += revQD;
      emp.totalOrders += 1;
      if (hinhThucXuat.includes('trả góp')) emp.slTraGop += 1;
    }

    // Đếm số khách tiếp cận (dựa trên tên khách hàng hoặc mã đơn)
    const customer = row['Tên khách hàng'] || row['Mã đơn hàng'];
    if (customer) emp.slTiepCan.add(customer);
  });

  return Object.values(empMap).map(emp => ({
    ...emp,
    slTiepCan: emp.slTiepCan.size,
    hieuQuaValue: emp.doanhThuThuc > 0 ? ((emp.doanhThuQD - emp.doanhThuThuc) / emp.doanhThuThuc) * 100 : 0,
    traChamPercent: emp.totalOrders > 0 ? (emp.slTraGop / emp.totalOrders) * 100 : 0
  })).sort((a, b) => b.doanhThuQD - a.doanhThuQD);
}
