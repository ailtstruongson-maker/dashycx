
import type { ProductConfig } from '../types';

const CONFIG_URL = 'https://docs.google.com/spreadsheets/d/e/YOUR_LINK_HERE/pub?output=csv';

export async function fetchProductConfig(): Promise<Record<string, number>> {
  try {
    const response = await fetch(CONFIG_URL);
    const csvText = await response.text();
    
    // Parse CSV đơn giản
    const lines = csvText.split('\n').slice(1); // Bỏ dòng header
    const configMap: Record<string, number> = {};

    lines.forEach(line => {
      const [nhomCha, nhomCon, maNhomHang, heSo] = line.split(',');
      if (maNhomHang && heSo) {
        configMap[maNhomHang.trim()] = parseFloat(heSo);
      }
    });

    return configMap;
  } catch (error) {
    console.error('Không thể tải file cấu hình hệ số:', error);
    // Trả về mặc định nếu lỗi
    return {};
  }
}
