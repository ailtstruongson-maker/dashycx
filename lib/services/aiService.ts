import { GoogleGenAI } from "@google/genai";
import type { KpiData, Employee } from '../types';

/**
 * Initialize AI Hub với mô hình Gemini 3 Flash mới nhất
 */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * AI phân tích tình hình kinh doanh tổng quan
 */
export async function getKpiSummary(kpis: KpiData): Promise<string> {
    const prompt = `Dựa vào dữ liệu KPI bán hàng hiện tại: ${JSON.stringify(kpis)}.
    Hãy viết 1 đoạn nhận xét cực kỳ súc tích (tối đa 35 từ) bằng tiếng Việt.
    Nêu bật Doanh thu quy đổi và cảnh báo nếu Hiệu quả quy đổi (<35%) hoặc Tỷ lệ trả góp thấp (<45%).`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "Dữ liệu đang được phân tích...";
    } catch (error) {
        console.error("Gemini Hub Error:", error);
        return "Trợ lý AI tạm thời gián đoạn.";
    }
}

/**
 * AI phân tích danh sách nhân viên xuất sắc và nhắc nhở
 */
export async function getEmployeePerformanceAnalysis(employees: Employee[]): Promise<string> {
    const topSellers = employees.slice(0, 5).map(e => ({
        name: e.name.split(' - ')[1],
        revenue: e.doanhThuQD,
        efficiency: e.hieuQuaValue
    }));

    const prompt = `Phân tích Top 5 nhân viên: ${JSON.stringify(topSellers)}.
    Hãy đưa ra nhận xét chuyên nghiệp bằng tiếng Việt:
    1. Khen ngợi cá nhân dẫn đầu.
    2. Chỉ ra ai cần cải thiện bán kèm nếu Hiệu quả < 30%.
    3. Một câu slogan truyền động lực ngắn gọn.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "AI đang đánh giá...";
    } catch (error) {
        return "Lỗi phân tích AI.";
    }
}

/**
 * AI Scan phiếu lương để lấy dữ liệu tính thuế
 */
export async function scanSalarySlip(base64Data: string, mimeType: string): Promise<any> {
    const prompt = `Phân tích hình ảnh phiếu lương này. Trích xuất chính xác các giá trị JSON sau:
    - "fullName": Họ tên người nhận.
    - "totalIncome": Thu nhập chịu thuế TNCN.
    - "dependents": Số người phụ thuộc.
    - "insurance": Tổng tiền bảo hiểm (BHXH, BHYT, BHTN).
    - "unionFee": Kinh phí công đoàn.
    - "bankAccount": Số tài khoản.
    Trả về giá trị 0 cho các trường số không tìm thấy.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                { inlineData: { mimeType, data: base64Data } },
                { text: prompt }
            ],
            config: { 
                responseMimeType: "application/json"
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("AI Scan Error:", error);
        throw new Error("AI không thể đọc phiếu lương này.");
    }
}