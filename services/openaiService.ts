import OpenAI from 'openai';

interface ChatMessage {
    role: 'user' | 'model' | 'assistant' | 'system';
    content: string;
}

// Helper to create client based on provider
const createClient = (provider: 'openai' | 'deepseek') => {
    if (provider === 'openai') {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) throw new Error("Missing VITE_OPENAI_API_KEY");
        return new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Client-side usage
        });
    } else {
        const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
        if (!apiKey) throw new Error("Missing VITE_DEEPSEEK_API_KEY");
        return new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }
};

export async function* streamOpenAIChat(
    history: { role: 'user' | 'model', content: string }[],
    newMessage: string,
    modelId: string,
    systemInstruction?: string
) {
    try {
        const provider = modelId.includes('deepseek') ? 'deepseek' : 'openai';
        const client = createClient(provider);

        // Convert history format
        const messages: any[] = history.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.content
        }));

        // Add system instruction if present
        if (systemInstruction) {
            messages.unshift({ role: 'system', content: systemInstruction });
        }

        // Add new message
        messages.push({ role: 'user', content: newMessage });

        const stream = await client.chat.completions.create({
            model: modelId,
            messages: messages,
            stream: true,
            temperature: 0.7,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) yield content;
        }

    } catch (error) {
        console.error("OpenAI/DeepSeek Stream Error:", error);
        yield `⚠️ Lỗi kết nối ${modelId}. Vui lòng kiểm tra API Key hoặc tín dụng.\n\nChi tiết: ${error instanceof Error ? error.message : String(error)}`;
    }
}

export async function analyzeContractWithDeepSeek(text: string): Promise<string> {
    try {
        const client = createClient('deepseek');

        const response = await client.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: "system",
                    content: "Bạn là chuyên gia pháp lý và quản trị hợp đồng. Nhiệm vụ của bạn là phân tích hợp đồng và đưa ra báo cáo rủi ro định dạng HTML (dùng thẻ <b>, <br>, <ul>, <li>, <span class='text-red-500'> cho rủi ro cao)."
                },
                {
                    role: "user",
                    content: `Hãy phân tích nội dung hợp đồng sau đây và tóm tắt các điểm quan quan trọng (Bên A, Bên B, Giá trị, Thời hạn, Rủi ro tiềm ẩn). Định dạng bằng tiếng Việt, súc tích, chuyên nghiệp. Nhấn mạnh vào rủi ro thanh toán và tiến độ: \n\n ${text}`
                }
            ],
            temperature: 0.2,
        });

        return response.choices[0].message.content || "Không có phản hồi từ DeepSeek.";
    } catch (error) {
        console.error("DeepSeek Analysis Error:", error);
        if (String(error).includes("401")) return "Lỗi: Sai hoặc thiếu DeepSeek API Key.";
        if (String(error).includes("402")) return "Lỗi: Hết tín dụng DeepSeek.";
        return "Không thể phân tích hợp đồng bằng DeepSeek lúc này.";
    }
}
