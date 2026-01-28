
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeContract(text: string) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing VITE_GOOGLE_API_KEY");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Hãy phân tích nội dung hợp đồng sau đây và tóm tắt các điểm quan quan trọng (Bên A, Bên B, Giá trị, Thời hạn, Rủi ro tiềm ẩn). Định dạng bằng tiếng Việt, súc tích, chuyên nghiệp: \n\n ${text}` }] }],
      generationConfig: {
        temperature: 0.2,
      },
    });
    return result.response.text();
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Không thể phân tích hợp đồng vào lúc này. Vui lòng thử lại sau.";
  }
}

export async function querySystemData(query: string, data: any) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing VITE_GOOGLE_API_KEY");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{
        role: 'user', parts: [{
          text: `Bạn là trợ lý quản trị cấp cao của ContractPro. Dựa trên dữ liệu hệ thống dưới đây, hãy trả lời câu hỏi của người dùng một cách chính xác, ngắn gọn và có phân tích chuyên môn.
      
      Dữ liệu hệ thống: ${JSON.stringify(data)}
      Câu hỏi: ${query}`
        }]
      }],
      generationConfig: {
        temperature: 0.1,
      },
    });
    return result.response.text();
  } catch (error) {
    return "Tôi đang gặp khó khăn khi kết nối với dữ liệu. Hãy thử hỏi lại nhé.";
  }
}

export async function getSmartInsights(contracts: any[]) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) return [{ title: "Chưa cấu hình AI", content: "Vui lòng thêm VITE_GOOGLE_API_KEY vào file .env", type: "warning" }];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const simplifiedData = contracts.map(c => ({
      id: c.id,
      val: c.value,
      client: c.partyA,
      status: c.status,
      revenue: c.actualRevenue,
      date: c.endDate,
      unit: c.unitId
    }));

    const sample = simplifiedData.sort(() => 0.5 - Math.random()).slice(0, 40);

    const result = await model.generateContent({
      contents: [{
        role: 'user', parts: [{
          text: `Bạn là chuyên gia phân tích dữ liệu doanh nghiệp. Dựa trên danh sách ${contracts.length} hợp đồng (dưới đây là mẫu ${sample.length} bản ghi), hãy đưa ra 3 nhận xét quan trọng (Insights) giúp quản lý ra quyết định.
      
      Yêu cầu:
      1. Tập trung vào: Tiến độ doanh thu, Rủi ro khách hàng (nếu có), hoặc Hiệu suất đơn vị.
      2. Ngắn gọn, súc tích (dưới 30 từ/insight).
      3. Output JSON format: [{"title": "Tiêu đề ngắn", "content": "Nội dung chi tiết", "type": "warning|info|success"}]
      
      Dữ liệu mẫu: ${JSON.stringify(sample)}`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
      },
    });

    return JSON.parse(result.response.text() || "[]");
  } catch (error) {
    console.error("Insight Error:", error);
    return [];
  }
}

// Enterprise AI: Chat Streaming
// Enterprise AI: Chat Streaming
export async function* streamGeminiChat(history: { role: 'user' | 'model', content: string }[], newMessage: string, systemInstruction?: string) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing API Key");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction || "Bạn là Trợ lý AI Enterprise của hệ thống ContractPro. Trả lời chuyên nghiệp, ngắn gọn, Format dạng Markdown đẹp mắt (dùng Bold cho ý chính, Table cho dữ liệu).",
    });

    // Sanitizing History for Gemini API (Must start with 'user')
    let validHistory = history.filter(msg => msg.content.trim() !== '');

    // Remove leading 'model' messages (e.g. welcome messages)
    while (validHistory.length > 0 && validHistory[0].role !== 'user') {
      validHistory.shift();
    }

    const chatHistory = validHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.3,
      }
    });

    const result = await chat.sendMessageStream(newMessage);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) yield chunkText;
    }

  } catch (error) {
    console.error("Stream Error:", error);
    yield "⚠️ Lỗi kết nối AI. Vui lòng kiểm tra API Key (.env) hoặc mạng.\n\nChi tiết lỗi: " + (error instanceof Error ? error.message : String(error));
  }
}
