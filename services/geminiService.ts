
import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeContract(text: string) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing VITE_GOOGLE_API_KEY");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy phân tích nội dung hợp đồng sau đây và tóm tắt các điểm quan quan trọng (Bên A, Bên B, Giá trị, Thời hạn, Rủi ro tiềm ẩn). Định dạng bằng tiếng Việt, súc tích, chuyên nghiệp: \n\n ${text}`,
      config: {
        temperature: 0.2,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Không thể phân tích hợp đồng vào lúc này. Vui lòng thử lại sau.";
  }
}

export async function querySystemData(query: string, data: any) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing VITE_GOOGLE_API_KEY");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bạn là trợ lý quản trị cấp cao của ContractPro. Dựa trên dữ liệu hệ thống dưới đây, hãy trả lời câu hỏi của người dùng một cách chính xác, ngắn gọn và có phân tích chuyên môn.
      
      Dữ liệu hệ thống: ${JSON.stringify(data)}
      Câu hỏi: ${query}`,
      config: {
        temperature: 0.1,
      },
    });
    return response.text;
  } catch (error) {
    return "Tôi đang gặp khó khăn khi kết nối với dữ liệu. Hãy thử hỏi lại nhé.";
  }
}

export async function getSmartInsights(contracts: any[]) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) return [{ title: "Chưa cấu hình AI", content: "Vui lòng thêm VITE_GOOGLE_API_KEY vào file .env", type: "warning" }];

    const ai = new GoogleGenAI({ apiKey });
    const simplifiedData = contracts.map(c => ({
      id: c.id,
      val: c.value,
      client: c.partyA,
      status: c.status,
      revenue: c.actualRevenue,
      date: c.endDate,
      unit: c.unitId // Added unit for context
    }));

    // Randomize sample if too large to get variety
    const sample = simplifiedData.sort(() => 0.5 - Math.random()).slice(0, 40);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Updated to latest stable flash if available, or keep preview
      contents: `Bạn là chuyên gia phân tích dữ liệu doanh nghiệp. Dựa trên danh sách ${contracts.length} hợp đồng (dưới đây là mẫu ${sample.length} bản ghi), hãy đưa ra 3 nhận xét quan trọng (Insights) giúp quản lý ra quyết định.
      
      Yêu cầu:
      1. Tập trung vào: Tiến độ doanh thu, Rủi ro khách hàng (nếu có), hoặc Hiệu suất đơn vị.
      2. Ngắn gọn, súc tích (dưới 30 từ/insight).
      3. Output JSON format: [{"title": "Tiêu đề ngắn", "content": "Nội dung chi tiết", "type": "warning|info|success"}]
      
      Dữ liệu mẫu: ${JSON.stringify(sample)}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Insight Error:", error);
    return [];
  }
}
