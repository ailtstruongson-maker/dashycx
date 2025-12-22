
import type { DataRow, FilterState } from '../types';

/**
 * Hàm lọc dữ liệu thô dựa trên trạng thái bộ lọc hiện tại
 */
export function applyAllFilters(allData: DataRow[], filters: FilterState): DataRow[] {
  if (!allData || allData.length === 0) return [];

  return allData.filter(row => {
    // 1. Lọc theo Kho (Single Select)
    if (filters.kho !== 'all' && row['normalizedKho'] !== filters.kho) return false;

    // 2. Lọc theo Trạng thái xuất (Single Select)
    if (filters.xuat !== 'all') {
      if (row['normalizedXuat'] !== filters.xuat) return false;
    }

    // 3. Lọc theo Khoảng ngày (Date Range)
    if (filters.startDate || filters.endDate) {
      const rowDate = row.parsedDate;
      if (!rowDate) return false;

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (rowDate < start) return false;
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (rowDate > end) return false;
      }
    }

    // 4. Lọc theo Người tạo (Multi-select)
    if (filters.nguoiTao.length > 0 && !filters.nguoiTao.includes(row['normalizedNguoiTao'])) return false;

    // 5. Lọc theo Trạng thái hồ sơ (Multi-select)
    if (filters.trangThai.length > 0 && !filters.trangThai.includes(row['normalizedTrangThai'])) return false;

    return true;
  });
}
