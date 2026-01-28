import { streamGeminiChat } from './geminiService';
import { streamOpenAIChat } from './openaiService';

export type AIModelId =
    | 'gemini-1.5-flash'
    | 'gemini-1.5-pro'
    | 'gemini-2.0-flash'
    | 'gemini-pro'
    | 'gpt-4o'
    | 'deepseek-chat' // DeepSeek V3/R1 often uses 'deepseek-chat' or specific names
    | 'deepseek-r1';  // Assuming 'deepseek-r1' alias mapping if needed

export async function* streamEnterpriseAI(
    history: { role: 'user' | 'model', content: string }[],
    newMessage: string,
    modelId: string,
    systemInstruction?: string
) {
    // Routing Logic
    if (modelId.startsWith('gemini')) {
        yield* streamGeminiChat(history, newMessage, modelId, systemInstruction);
    } else if (modelId.startsWith('gpt') || modelId.startsWith('deepseek')) {
        // Map internal IDs to API specific IDs if necessary
        let apiModelId = modelId;
        if (modelId === 'deepseek-r1') apiModelId = 'deepseek-chat'; // Currently DeepSeek V3 is main, R1 might be beta. Using 'deepseek-chat' is safest for now or 'deepseek-reasoner'. 
        // Let's stick to 'deepseek-chat' for general purpose, or 'deepseek-reasoner' for R1 if specifically requested. 
        // User asked for "Deep seek", likely DeepSeek-V3 (chat) or R1 (reasoner).
        // Let's assume standard 'deepseek-chat' for now to ensure it works.

        // UPDATE: User UI sends 'deepseek-r1'. DeepSeek API uses 'deepseek-reasoner' for R1.
        if (modelId === 'deepseek-r1') apiModelId = 'deepseek-reasoner';

        yield* streamOpenAIChat(history, newMessage, apiModelId, systemInstruction);
    } else {
        yield "⚠️ Model không được hỗ trợ.";
    }
}
