
/**
 * Định dạng tiền tệ: 1.500.000 -> 1.5 Tr, 1.500.000.000 -> 1.5 Tỷ
 */
export function formatCurrency(num: number): string {
  if (!num || isNaN(num)) return '0';
  
  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2).replace(/\.00$/, '') + ' Tỷ';
  }
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Tr';
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(0) + ' K';
  }
  return num.toLocaleString('vi-VN');
}

/**
 * Định dạng số lượng đơn hàng
 */
export function formatNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  return num.toLocaleString('vi-VN');
}
