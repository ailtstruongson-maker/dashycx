
import type { DataRow, Employee } from '../types';

export interface EmployeeExt extends Employee {
  slBaoHiem: number;
  slSim: number;
  slDongHo: number;
  dtPhuKien: number;
  dtGiaDung: number;
  slCE_Main: number;
  slICT_Main: number;
  percentBH: number;
  last7Days: Record<string, number>; // Lưu doanh thu theo từng ngày trong 7 ngày
}

export function summarizeEmployees(rows: DataRow[], deptMap: Record<string, string>): EmployeeExt[] {
  const empMap: Record<string, any> = {};
  
  // Xác định mốc 7 ngày gần nhất
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  rows.forEach(row => {
    const name = row.normalizedNguoiTao || 'Không tên';
    const rev = row.computedRevenue || 0;
    const revQD = row.computedRevenueQD || 0;
    const hinhThucXuat = (row['Hình thức xuất'] || '').toString().toLowerCase();
    const industry = (row['Ngành hàng'] || '').toString().toLowerCase();
    const qty = parseFloat(row['Số lượng']) || 1;
    const date = row.parsedDate;

    if (!empMap[name]) {
      const id = name.split(' - ')[0];
      empMap[name] = {
        name,
        department: deptMap[id] || 'Chưa phân ca',
        doanhThuThuc: 0,
        doanhThuQD: 0,
        slTraGop: 0,
        totalOrders: 0,
        slTiepCan: new Set(),
        slBaoHiem: 0,
        slSim: 0,
        slDongHo: 0,
        dtPhuKien: 0,
        dtGiaDung: 0,
        slCE_Main: 0,
        slICT_Main: 0,
        last7Days: {}
      };
    }

    const emp = empMap[name];
    
    if (!hinhThucXuat.includes('thu hộ')) {
      emp.doanhThuThuc += rev;
      emp.doanhThuQD += revQD;
      emp.totalOrders += 1;
      if (hinhThucXuat.includes('trả góp')) emp.slTraGop += 1;

      if (industry.includes('bảo hiểm')) emp.slBaoHiem += qty;
      if (industry.includes('sim')) emp.slSim += qty;
      if (industry.includes('đồng hồ') || industry.includes('wearable')) emp.slDongHo += qty;
      if (industry.includes('phụ kiện')) emp.dtPhuKien += rev;
      if (industry.includes('gia dụng')) emp.dtGiaDung += rev;

      if (industry.includes('điện thoại') || industry.includes('laptop') || industry.includes('tablet')) emp.slICT_Main += qty;
      if (industry.includes('tivi') || industry.includes('tủ lạnh') || industry.includes('máy giặt')) emp.slCE_Main += qty;

      // Tính doanh thu 7 ngày
      if (date && date >= sevenDaysAgo) {
        const dayKey = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        emp.last7Days[dayKey] = (emp.last7Days[dayKey] || 0) + revQD;
      }
    }

    const customer = row['Tên khách hàng'] || row['Mã đơn hàng'];
    if (customer) emp.slTiepCan.add(customer);
  });

  return Object.values(empMap).map(emp => {
    const slMain = emp.slICT_Main + emp.slCE_Main;
    return {
      ...emp,
      slTiepCan: emp.slTiepCan.size,
      hieuQuaValue: emp.doanhThuThuc > 0 ? ((emp.doanhThuQD - emp.doanhThuThuc) / emp.doanhThuThuc) * 100 : 0,
      traChamPercent: emp.totalOrders > 0 ? (emp.slTraGop / emp.totalOrders) * 100 : 0,
      percentBH: slMain > 0 ? (emp.slBaoHiem / slMain) * 100 : 0
    };
  }).sort((a, b) => b.doanhThuQD - a.doanhThuQD);
}
