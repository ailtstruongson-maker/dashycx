import type { DataRow, SummaryTableNode, ProductConfig } from '../types';
import { COL, HINH_THUC_XUAT_THU_HO, HINH_THUC_XUAT_TIEN_MAT, HINH_THUC_XUAT_TRA_GOP } from '../constants';


export function getRowValue(row: DataRow, keys: string[]): any {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
    }
    return undefined;
}

export function toLocalISOString(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function parseExcelDate(excelDate: any): Date | null {
    if (excelDate instanceof Date && !isNaN(excelDate.getTime())) return excelDate;
    if (typeof excelDate === 'number') {
        return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    }
    if (typeof excelDate === 'string') {
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) return date;
    }
    return null;
}

export function abbreviateName(fullName: string): string {
    if (!fullName || !fullName.includes(' - ')) return fullName;
    const parts = fullName.split(' - ');
    const id = parts[0];
    const name = parts[1];
    const nameWords = name.trim().split(' ');
    if (nameWords.length <= 1) return fullName;
    const lastName = nameWords[nameWords.length - 1];
    const middleNameInitial = nameWords.length > 2 ? nameWords[nameWords.length - 2].charAt(0).toUpperCase() : nameWords[0].charAt(0).toUpperCase();
    return `${id} - ${middleNameInitial}.${lastName}`;
}

export function formatCurrency(number: number, precision = 0): string {
    if (isNaN(number) || number === 0) return '-';
    if (Math.abs(number) >= 1000000000) return `${(number / 1000000000).toFixed(1).replace(/\.0$/, '')} Tỷ`;
    if (Math.abs(number) >= 1000000) return `${(number / 1000000).toFixed(precision).replace(/\.0$/, '')} Tr`;
    if (Math.abs(number) >= 1000) return `${Math.round(number / 1000)} K`;
    return number.toLocaleString('vi-VN');
}

export function formatRevenueForHeadToHead(value: number | undefined): string {
    if (value === undefined || isNaN(value) || value === 0) return '-';
    const roundedValue = Math.round(value / 1000000);
    return roundedValue.toLocaleString('vi-VN');
}

export function formatQuantity(value: number | null | undefined): string {
    if (value == null || isNaN(value) || value === 0) return '-';
    return value.toLocaleString('vi-VN');
}

export function formatQuantityWithFraction(value: number | null | undefined): string {
    if (value == null || isNaN(value) || value === 0) return '-';
    return value.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
}


export function getHeSoQuyDoi(maNganhHang: string, maNhomHang: string, productConfig: ProductConfig | null): number {
    const parentGroup = productConfig?.childToParentMap?.[maNhomHang];

    // Priority 1: Use parent group from config file for primary categories
    if (parentGroup) {
        switch (parentGroup) {
            case 'Phụ kiện': return 3.37;
            case 'Wearable': 
            case 'Đồng hồ': return 3.0;
            case 'Laptop': return 1.2;
            case 'Tablet': return 1.2;
            case 'Gia dụng': return 1.85;
            case 'Sim': return 5.45;
            case 'Bảo hiểm': return 4.18;
            case 'IT': return 2.0;
            case 'Thẻ cào':
            case 'ICT': // Smartphones are in here
            case 'CE': // Tivi, etc.
                return 1.0;
            default:
                // If the parent group is known but not in the switch, it might fall through to the old logic.
                // This is a good safety net.
                break;
        }
    }

    // Priority 2: Fallback to old logic for compatibility or items not in config
    if (maNganhHang && maNganhHang.includes('Thẻ cào')) return 1.0;
    if (maNganhHang === '164 - VAS' && (maNhomHang === '4479 - Dịch Vụ Bảo Hiểm' || maNhomHang === '4499 - Thu Hộ Phí Bảo Hiểm')) return 4.18;
    if (maNganhHang === '304 - Điện tử' && maNhomHang === '880 - Loa Karaoke') return 1.29; // This is a special case not covered by parent groups
    
    switch (maNganhHang) {
        case '664 - Sim Online': return 5.45;
        case '16 - Phụ kiện tiện ích':
        case '184 - Phụ kiện trang trí':
        case '764 - Loa vi tính': return 3.37;
        case '23 - Wearable':
        case '1274 - Đồng Hồ Thời Trang': return 3.0;
        case '364 - IT': return 2.0;
        case '1034 - Dụng cụ nhà bếp': return 1.92; // Keeping this specific one
        case '1116 - Máy lọc nước':
        case '484 - Điện gia dụng':
        case '1214 - Gia dụng lắp đặt': return 1.85;
        case '22 - Laptop':
        case '244 - Tablet': return 1.2;
        default: return 1.0;
    }
}

export function sortSummaryData(data: { [key: string]: SummaryTableNode }, sortKey: string, sortDir: 'asc' | 'desc'): { [key: string]: SummaryTableNode } {
    const sortFn = (a: [string, SummaryTableNode], b: [string, SummaryTableNode]) => {
        const nodeA = a[1];
        const nodeB = b[1];
        let valA, valB;

        switch(sortKey) {
           case 'aov':
                valA = nodeA.totalQuantity > 0 ? nodeA.totalRevenue / nodeA.totalQuantity : 0;
                valB = nodeB.totalQuantity > 0 ? nodeB.totalRevenue / nodeB.totalQuantity : 0;
                break;
           case 'traGopPercent':
                valA = nodeA.totalRevenue > 0 ? (nodeA.totalTraGop / nodeA.totalRevenue) * 100 : 0;
                valB = nodeB.totalRevenue > 0 ? (nodeB.totalTraGop / nodeB.totalRevenue) * 100 : 0;
                break;
           default:
                valA = nodeA[sortKey as keyof SummaryTableNode] || 0;
                valB = nodeB[sortKey as keyof SummaryTableNode] || 0;
        }
        
        if (valA === valB) return 0;
        const result = (valA < valB) ? -1 : 1;
        return sortDir === 'asc' ? result : -result;
    };

    const sortedEntries = Object.entries(data).sort(sortFn);
    const sortedData = Object.fromEntries(sortedEntries);
    
    for (const key in sortedData) {
        if (Object.keys(sortedData[key].children).length > 0) {
            sortedData[key].children = sortSummaryData(sortedData[key].children, sortKey, sortDir);
        }
    }
    return sortedData;
}

export function isValidSale(row: DataRow): boolean {
    const getString = (keys: string[]) => (getRowValue(row, keys) || '').toString().trim().toLowerCase();
    
    return getString(COL.TRANG_THAI_HUY) === 'chưa hủy' &&
           getString(COL.TINH_TRANG_NHAP_TRA) === 'chưa trả' &&
           getString(COL.TRANG_THAI_THU_TIEN) === 'đã thu';
}

export function getHinhThucThanhToan(row: DataRow): 'tra_gop' | 'tien_mat' | 'thu_ho' | 'khac' {
    const hinhThucXuat = getRowValue(row, COL.HINH_THUC_XUAT);
    if (HINH_THUC_XUAT_TRA_GOP.has(hinhThucXuat)) return 'tra_gop';
    if (HINH_THUC_XUAT_TIEN_MAT.has(hinhThucXuat)) return 'tien_mat';
    if (HINH_THUC_XUAT_THU_HO.has(hinhThucXuat)) return 'thu_ho';
    return 'khac';
}

export const getDisplayParentGroup = (maNhomHang: string, productConfig: ProductConfig): string => {
    const parentGroup = productConfig.childToParentMap[maNhomHang] || 'Khác';
    const childGroup = productConfig.childToSubgroupMap[maNhomHang];

    if (parentGroup === 'ICT' && ['Smartphone', 'Laptop', 'Tablet'].includes(childGroup)) {
        return childGroup;
    }
    if (parentGroup === 'Gia dụng' && childGroup === 'Máy lọc nước') {
        return 'Máy lọc nước';
    }
    return parentGroup;
};