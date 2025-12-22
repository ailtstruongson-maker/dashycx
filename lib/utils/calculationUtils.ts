
import { get } from 'svelte/store';
import { productConfig } from '../stores/dashboardStore';

/**
 * Lấy hệ số quy đổi dựa trên quy tắc ưu tiên
 * 1. Tên sản phẩm Vieon (Ưu tiên tuyệt đối)
 * 2. Cấu hình Admin từ file Google Sheets
 * 3. Fallback theo tên ngành hàng
 */
export function getConversionFactor(row: any): number {
  const productName = (row['Tên sản phẩm'] || row['Tên Sản Phẩm'] || '').toString();
  const maNhomHang = (row['Nhóm hàng'] || '').toString().trim();
  const nganhHangText = (row['Ngành hàng'] || '').toString().toLowerCase();

  // 1. Logic đặc thù cho sản phẩm Vieon (Dựa trên tên)
  if (productName.includes('VieON VIP')) {
    if (productName.includes('01 tháng')) return 1;
    if (productName.includes('03 tháng')) return 2;
    if (productName.includes('06 tháng')) return 4;
    return 1; 
  }

  // 2. Kiểm tra trong map cấu hình tải từ Google Sheets
  const config = get(productConfig);
  if (config && config[maNhomHang]) {
    return config[maNhomHang];
  }

  // 3. Fallback logic dựa trên từ khóa ngành hàng (Mặc định hệ thống)
  if (nganhHangText.includes('phụ kiện')) return 3.37;
  if (nganhHangText.includes('gia dụng')) return 1.85;
  if (nganhHangText.includes('bảo hiểm')) return 4.18;
  if (nganhHangText.includes('sim')) return 5.45;
  if (nganhHangText.includes('đồng hồ') || nganhHangText.includes('wearable')) return 3.0;
  if (nganhHangText.includes('laptop') || nganhHangText.includes('tablet')) return 1.2;
  
  return 1.0; // Mặc định cho Điện thoại, Tivi, v.v.
}

/**
 * Tính toán các giá trị quy đổi cho một dòng đơn hàng
 */
export function calculateRowMetrics(row: any) {
  const price = parseFloat(row['Giá bán_1']) || 0;
  const factor = getConversionFactor(row);
  
  return {
    revenue: price,
    revenueQD: price * factor,
    factor: factor
  };
}
