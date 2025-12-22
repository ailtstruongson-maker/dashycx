
export const YCX_COLUMNS = {
  KHO: ['Mã kho tạo', 'Mã kho'],
  XUAT: ['Trạng thái xuất'],
  NGUOI_TAO: ['Người tạo', 'Nhân viên tạo'],
  TRANG_THAI_HS: ['Trạng thái hồ sơ', 'Loại hồ sơ'],
  GIA_BAN: ['Giá bán_1'],
  NGAY_TAO: ['Ngày tạo'],
  TEN_SP: ['Tên sản phẩm', 'Tên Sản Phẩm']
};

export function getColumnValue(row: any, aliases: string[]): any {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) return row[alias];
  }
  return '';
}
