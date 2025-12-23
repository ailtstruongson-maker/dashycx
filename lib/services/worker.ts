
import * as XLSX from 'xlsx';
import { applyAllFilters } from './filterService';
import { processDashboardData } from './dataProcessor';
import type { DataRow, FilterState } from '../types';

let cachedOriginalData: any[] = [];
let columnHeaders: string[] = [];

// Hàm helper để truy xuất giá trị từ mảng dựa trên tên cột
function getValue(rowArr: any[], colName: string): any {
  const index = columnHeaders.indexOf(colName);
  return index !== -1 ? rowArr[index] : undefined;
}

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  try {
    if (type === 'IMPORT_FILE') {
      const { file } = payload;
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      // Tối ưu 1: Dùng dense mode để tiết kiệm bộ nhớ
      const workbook = XLSX.read(data, { type: 'array', cellDates: true, dense: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Tối ưu 2: Lấy dữ liệu dạng mảng của mảng (Raw Arrays) - Nhanh hơn 2-3 lần so với sheet_to_json
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      
      if (rawRows.length === 0) throw new Error("File không có dữ liệu");
      
      columnHeaders = rawRows[0].map(h => String(h).trim());
      const dataContent = rawRows.slice(1);
      
      // Tối ưu 3: Mapping dữ liệu trong 1 vòng lặp duy nhất
      cachedOriginalData = dataContent.map((row) => {
        const xuatValue = getValue(row, 'Trạng thái xuất') || '';
        const ngayTao = getValue(row, 'Ngày tạo');
        
        // Tạo object "phẳng" tối giản để gửi về Main Thread
        const obj: any = {
          'Mã kho tạo': getValue(row, 'Mã kho tạo'),
          'Trạng thái xuất': xuatValue,
          'Người tạo': getValue(row, 'Người tạo'),
          'Trạng thái hồ sơ': getValue(row, 'Trạng thái hồ sơ'),
          'Ngành hàng': getValue(row, 'Ngành hàng'),
          'Số lượng': getValue(row, 'Số lượng'),
          'Giá bán_1': getValue(row, 'Giá bán_1'),
          'Hình thức xuất': getValue(row, 'Hình thức xuất'),
          'Tên sản phẩm': getValue(row, 'Tên sản phẩm'),
          normalizedKho: String(getValue(row, 'Mã kho tạo') || ''),
          normalizedXuat: String(xuatValue).toLowerCase().includes('đã') ? 'Đã' : 'Chưa',
          normalizedNguoiTao: String(getValue(row, 'Người tạo') || ''),
          normalizedTrangThai: String(getValue(row, 'Trạng thái hồ sơ') || ''),
          parsedDate: ngayTao instanceof Date ? ngayTao : new Date(ngayTao)
        };
        return obj;
      });

      const result = processDashboardData(cachedOriginalData);
      self.postMessage({ type: 'SUCCESS', payload: result });
    }

    if (type === 'APPLY_FILTER') {
      const filtered = applyAllFilters(cachedOriginalData, payload);
      const result = processDashboardData(filtered);
      self.postMessage({ type: 'FILTER_SUCCESS', payload: result });
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', message: error.message });
  }
};
