/**
 * AI Assistant — shared types, constants, and message utilities.
 * Extracted from AIAssistant.tsx (Phase 2 refactor).
 */

import * as Icons from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
}

export type ActiveView = 'chat' | 'ingest';

// ─── Storage keys ───────────────────────────────────────────────────────────

export const getStorageKey = (userId?: string) =>
  userId ? `cic_ai_chat_history_${userId}` : 'cic_ai_chat_history';

export const MODEL_STORAGE_KEY = 'cic_ai_model';
export const AGENT_STORAGE_KEY = 'cic_ai_agent';

export const CUSTOM_GEMINI_KEY = 'cic_custom_gemini_key';
export const CUSTOM_OPENAI_KEY = 'cic_custom_openai_key';
export const CUSTOM_DEEPSEEK_KEY = 'cic_custom_deepseek_key';

// ─── Message persistence ────────────────────────────────────────────────────

export const saveMessages = (messages: Message[], userId?: string): void => {
  try {
    const toSave = messages.slice(-50).map(m => ({
      ...m,
      isStreaming: false,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    }));
    localStorage.setItem(getStorageKey(userId), JSON.stringify(toSave));
  } catch { /* localStorage full or unavailable */ }
};

export const loadMessages = (userId?: string): Message[] => {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
      isStreaming: false,
    }));
  } catch { return []; }
};

export const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'model',
  content: 'Xin chào! Tôi là Trợ lý AI Enterprise của bạn. \n\nTôi có thể giúp gì cho bạn hôm nay? Hãy chọn một gợi ý bên dưới hoặc nhập câu hỏi trực tiếp.',
  timestamp: new Date(),
};

// ─── Icon map (agent icons) ──────────────────────────────────────────────────

export const ICON_MAP: Record<string, any> = {
  Sparkles: Icons.Sparkles,
  Scale: Icons.Scale,
  PenTool: Icons.PenTool,
  BarChart3: Icons.BarChart3,
  Crown: Icons.Crown,
  Box: Icons.Box,
  Leaf: Icons.Leaf,
  HardHat: Icons.HardHat,
  Monitor: Icons.Monitor,
  Calculator: Icons.Calculator,
  Compass: Icons.Compass,
  Users: Icons.Users,
  MapPin: Icons.MapPin,
  Shield: Icons.Shield,
  Download: Icons.Download,
  Terminal: Icons.Terminal,
};
