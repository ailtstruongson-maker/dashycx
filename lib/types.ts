import type { Chat } from "@google/genai";

// --- Trạng thái Ứng dụng ---
export type AppState = 'upload' | 'loading' | 'processing' | 'dashboard';

export interface Status {
    message: string;
    type: 'info' | 'success' | 'error';
    progress: number;
}

// --- Dữ liệu thô từ Excel ---
export interface DataRow {
    [key: string]: any;
    parsedDate?: Date;
    normalizedKho?: string;
    normalizedXuat?: string;
    normalizedNguoiTao?: string;
    normalizedTenSP?: string;
    computedRevenue?: number;
    computedRevenueQD?: number;
}

// --- Cấu hình Sản phẩm & Hệ số ---
export interface ProductConfig {
    [maNhomHang: string]: number; // Ánh xạ Mã nhóm hàng -> Hệ số quy đổi
}

export interface StoredSalesData {
    data: DataRow[];
    filename: string;
    savedAt: Date;
}

export interface StoredProductConfig {
    config: ProductConfig;
    url: string;
    fetchedAt: Date;
}

// --- Dữ liệu đã xử lý cho Dashboard ---
export interface KpiData {
    doanhThuQD: number;
    totalRevenue: number;
    soLuongThuHo: number;
    hieuQuaQD: number;
    traGopPercent: number;
    traGopValue: number;
    traGopCount: number;
    doanhThuThucChoXuat: number;
    doanhThuQDChoXuat: number;
}

export interface TrendData {
    daily: Record<string, { revenue: number; revenueQD: number; date: Date }>;
    shifts: Record<string, { revenue: number; revenueQD: number }>;
}

export interface IndustryData {
    name: string;
    revenue: number;
    quantity: number;
}

export interface Employee {
    name: string;
    department: string;
    doanhThuThuc: number;
    doanhThuQD: number;
    hieuQuaValue: number;
    slTiepCan: number;
    traChamPercent: number;
    slThuHo: number;
    totalOrders: number;
}

export interface ProcessedData {
    kpis: KpiData;
    trendData: TrendData;
    industryData: IndustryData[];
    employeeData: {
        fullSellerArray: Employee[];
        averages: Record<string, number>;
    };
    unshippedOrders: DataRow[];
    lastUpdated: string;
    reportSubTitle: string;
    warehouseSummary?: any[];
}

// --- Trạng thái Bộ lọc ---
export interface FilterState {
    kho: string;
    xuat: string;
    trangThai: string[];
    nguoiTao: string[];
    department: string[];
    startDate: string;
    endDate: string;
    dateRange: string;
    industryGrid: {
        selectedGroups: string[];
        selectedSubgroups: string[];
    };
    summaryTable: {
        parent: string[];
        child: string[];
        manufacturer: string[];
        creator: string[];
        product: string[];
        drilldownOrder: string[];
        sort: { column: string; direction: 'asc' | 'desc' };
    };
}

// --- Bảng Thi đua Tùy chỉnh ---
export interface ColumnConfig {
    id: string;
    mainHeader: string;
    columnName: string;
    type: 'data' | 'calculated';
    metricType?: 'quantity' | 'revenue' | 'revenueQD';
    operation?: '+' | '-' | '*' | '/';
    operand1_columnId?: string;
    operand2_columnId?: string;
    displayAs?: 'number' | 'percentage';
}

export interface ContestTableConfig {
    id: string;
    tableName: string;
    columns: ColumnConfig[];
    defaultSortColumnId?: string;
}

export interface CustomContestTab {
    id: string;
    name: string;
    icon: string;
    tables: ContestTableConfig[];
}

// --- Bảng Theo dõi 7 ngày (Head-to-Head) ---
export interface HeadToHeadConditionalFormatRule {
  id: string;
  criteria: 'specific_value' | 'column_dept_avg' | 'row_avg';
  operator: '>' | '<' | '=';
  value: number;
  textColor: string;
  backgroundColor: string;
}

export interface HeadToHeadTableConfig {
    id: string;
    tableName: string;
    selectedSubgroups: string[];
    selectedParentGroups?: string[];
    metricType: 'revenue' | 'quantity' | 'revenueQD' | 'hieuQuaQD';
    totalCalculationMethod?: 'sum' | 'average';
    conditionalFormats?: HeadToHeadConditionalFormatRule[];
}

// --- AI & Chat ---
export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface AnalysisRecord {
    timestamp: number;
    type: 'topSeller';
    analysis: string;
    dataUsed: Employee[];
}
