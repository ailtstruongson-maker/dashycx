
import * as XLSX from 'xlsx';
import { YCX_COLUMNS, getColumnValue } from '../constants';

self.onmessage = async (e) => {
  const { file } = e.data;
  
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const rawJson = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

    const processedData = rawJson.map(row => {
      const xuatRaw = getColumnValue(row, YCX_COLUMNS.XUAT).toString().toLowerCase();
      
      return {
        ...row,
        normalizedKho: getColumnValue(row, YCX_COLUMNS.KHO).toString(),
        normalizedXuat: xuatRaw.includes('đã') ? 'Đã' : 'Chưa',
        normalizedNguoiTao: getColumnValue(row, YCX_COLUMNS.NGUOI_TAO).toString(),
        normalizedTrangThai: getColumnValue(row, YCX_COLUMNS.TRANG_THAI_HS).toString(),
        normalizedTenSP: getColumnValue(row, YCX_COLUMNS.TEN_SP).toString(), // Thêm chuẩn hóa tên SP
        computedRevenue: parseFloat(getColumnValue(row, YCX_COLUMNS.GIA_BAN)) || 0
      };
    });

    const cleanedData = processedData.filter(row => {
      const isNotCanceled = (row['Trạng thái hủy'] || '').toString().toLowerCase().includes('chưa');
      const isNotReturned = (row['Tình trạng nhập trả của sản phẩm đổi với sản phẩm chính'] || '').toString().toLowerCase().includes('chưa');
      const isPaid = (row['Trạng thái thu tiền'] || '').toString().toLowerCase().includes('đã');
      return isNotCanceled && isNotReturned && isPaid;
    });

    self.postMessage({ type: 'SUCCESS', payload: cleanedData });
  } catch (error) {
    self.postMessage({ type: 'ERROR', message: error.message });
  }
};
