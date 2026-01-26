
import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeContract(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const simplifiedData = contracts.map(c => ({
      id: c.id,
      val: c.value,
      client: c.partyA,
      status: c.status,
      revenue: c.actualRevenue,
      date: c.endDate
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Dựa trên dữ liệu 400 hợp đồng này, hãy đưa ra 3 nhận xét thông minh (Insights) về tình hình kinh doanh (ví dụ rủi ro tập trung khách hàng, dự báo doanh thu, hoặc các hợp đồng cần chú ý). Trả lời dưới dạng JSON array: [{"title": "...", "content": "...", "type": "warning|info|success"}] 
      
      Dữ liệu: ${JSON.stringify(simplifiedData.slice(0, 50))}`, // Gửi sample để tiết kiệm token
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Insight Error:", error);
    return [];
  }
}
