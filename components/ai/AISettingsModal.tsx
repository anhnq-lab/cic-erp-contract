/**
 * AI Assistant — AISettingsModal.
 * Extracted from AIAssistant.tsx (Phase 2 refactor).
 *
 * Self-contained settings modal: API keys + Local AI config + guide.
 * All settings state is internal; caller only provides onClose().
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Settings, X, KeyRound, BookOpen, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import {
  CUSTOM_GEMINI_KEY,
  CUSTOM_OPENAI_KEY,
  CUSTOM_DEEPSEEK_KEY,
} from './aiTypes';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AISettingsModalProps {
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AISettingsModal: React.FC<AISettingsModalProps> = ({ onClose }) => {
  const [settingsTab, setSettingsTab] = useState<'config' | 'guide' | 'local'>('config');
  const [customGeminiKey, setCustomGeminiKey] = useState(() => localStorage.getItem(CUSTOM_GEMINI_KEY) || '');
  const [customOpenAIKey, setCustomOpenAIKey] = useState(() => localStorage.getItem(CUSTOM_OPENAI_KEY) || '');
  const [customDeepseekKey, setCustomDeepseekKey] = useState(() => localStorage.getItem(CUSTOM_DEEPSEEK_KEY) || '');
  const [localAIBaseURL, setLocalAIBaseURL] = useState(() => localStorage.getItem('cic_local_ai_base_url') || '/api/vllm');
  const [localAITestResult, setLocalAITestResult] = useState<{ ok: boolean; models: string[] } | null>(null);
  const [localAITesting, setLocalAITesting] = useState(false);

  // ─── Save settings ──────────────────────────────────────────────────────────

  const saveSettings = () => {
    localStorage.setItem(CUSTOM_GEMINI_KEY, customGeminiKey);
    localStorage.setItem(CUSTOM_OPENAI_KEY, customOpenAIKey);
    localStorage.setItem(CUSTOM_DEEPSEEK_KEY, customDeepseekKey);
    localStorage.setItem('cic_local_ai_base_url', localAIBaseURL);
    onClose();
    toast.success('Đã lưu cấu hình!');
  };

  // ─── Test Local AI Connection ───────────────────────────────────────────────

  const testLocalAI = useCallback(async () => {
    setLocalAITesting(true);
    setLocalAITestResult(null);
    try {
      let models: string[] = [];

      // Lấy từ Ollama Native Proxy
      try {
        const res = await fetch(`/api/ollama_native/tags`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json() as { models?: { name: string }[] };
          if (data.models && data.models.length > 0) {
            models = [...models, ...data.models.map(m => m.name)];
          }
        }
      } catch (err) { console.warn('Ollama timeout:', err); }

      // Lấy từ vLLM Proxy
      try {
        const res = await fetch(`/api/vllm/models`, {
          signal: AbortSignal.timeout(3000),
          headers: { 'Authorization': `Bearer sk-cic-2026` }
        });
        if (res.ok) {
          const data = await res.json() as { data?: { id: string }[] };
          if (data.data && data.data.length > 0) {
            models = [...models, ...data.data.map(m => m.id)];
          }
        }
      } catch (err) { console.warn('vLLM timeout:', err); }

      // Lấy từ vLLM Proxy (Gemma)
      try {
        const res = await fetch(`/api/vllm_gemma/models`, {
          signal: AbortSignal.timeout(3000),
          headers: { 'Authorization': `Bearer sk-cic-2026` }
        });
        if (res.ok) {
          const data = await res.json() as { data?: { id: string }[] };
          if (data.data && data.data.length > 0) {
            models = [...models, ...data.data.map(m => m.id)];
          }
        }
      } catch (err) { console.warn('vLLM Gemma timeout:', err); }

      // Lấy từ localAIBaseURL nếu user nhập vào custom url không phải localhost
      if (!localAIBaseURL.includes('localhost') && !localAIBaseURL.includes('127.0.0.1') && !localAIBaseURL.includes('/api/vllm')) {
        let v1Url = localAIBaseURL;
        if (!v1Url.includes('/v1')) v1Url = v1Url.replace(/\/$/, '') + '/v1';
        try {
          const res = await fetch(`${v1Url}/models`, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const data = await res.json() as { data?: { id: string }[] };
            if (data.data && data.data.length > 0) {
              models = [...models, ...data.data.map(m => m.id)];
            }
          }
        } catch (err) { console.warn('Custom local error:', err); }
      }

      // Xóa model trùng lặp
      models = Array.from(new Set(models));

      if (models.length > 0) {
        setLocalAITestResult({ ok: true, models });
      } else {
        throw new Error('Không lấy được danh sách model');
      }
    } catch {
      setLocalAITestResult({ ok: false, models: [] });
    } finally {
      setLocalAITesting(false);
    }
  }, [localAIBaseURL]);

  useEffect(() => {
    testLocalAI();
  }, [testLocalAI]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings size={20} className="text-indigo-500" />
            Cài đặt API cá nhân
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            onClick={() => setSettingsTab('config')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all cursor-pointer relative",
              settingsTab === 'config'
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <KeyRound size={16} />
            API Keys
            {settingsTab === 'config' && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setSettingsTab('local')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all cursor-pointer relative",
              settingsTab === 'local'
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            🖥️ Local AI
            {settingsTab === 'local' && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setSettingsTab('guide')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all cursor-pointer relative",
              settingsTab === 'guide'
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <BookOpen size={16} />
            Hướng dẫn
            {settingsTab === 'guide' && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {settingsTab === 'config' ? (
          <>
            <div className="p-4 md:p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Sử dụng API Key cá nhân của bạn để bỏ qua giới hạn của hệ thống. Key được lưu trữ an toàn ngay trên trình duyệt của bạn (localStorage).
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Google Gemini API Key</label>
                  <input
                    type="password"
                    value={customGeminiKey}
                    onChange={(e) => setCustomGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">OpenAI API Key (GPT-4o)</label>
                  <input
                    type="password"
                    value={customOpenAIKey}
                    onChange={(e) => setCustomOpenAIKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">DeepSeek API Key (R1/Chat)</label>
                  <input
                    type="password"
                    value={customDeepseekKey}
                    onChange={(e) => setCustomDeepseekKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-all"
              >
                Hủy
              </button>
              <button
                onClick={saveSettings}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-200 dark:shadow-none transition-all"
              >
                Lưu cài đặt
              </button>
            </div>
          </>
        ) : settingsTab === 'local' ? (
          <>
            <div className="p-4 md:p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Cấu hình kết nối Ollama (Local AI). Dữ liệu không rời khỏi máy bạn — bảo mật 100%.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Ollama Base URL</label>
                <input
                  type="text"
                  value={localAIBaseURL}
                  onChange={(e) => setLocalAIBaseURL(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>

              <button
                onClick={testLocalAI}
                disabled={localAITesting}
                className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {localAITesting ? (
                  <><span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Đang kiểm tra...</>
                ) : (
                  <>🔍 Kiểm tra kết nối</>
                )}
              </button>

              {localAITestResult && (
                <div className={cn(
                  "rounded-xl p-4 border",
                  localAITestResult.ok
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                )}>
                  {localAITestResult.ok ? (
                    <>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-2">✅ Hệ thống Local AI (vLLM) sẵn sàng — {localAITestResult.models.length} models</p>
                      <div className="space-y-1">
                        {localAITestResult.models.map((m, i) => (
                          <p key={i} className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">• {m}</p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-300">❌ Không kết nối được Ollama</p>
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Kiểm tra: <code className="bg-rose-100 dark:bg-rose-900/30 px-1 rounded">ollama serve</code> đã chạy chưa?</p>
                    </>
                  )}
                </div>
              )}

              <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3">
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">💡 vLLM Engine tự tải model. Tốc độ cao nhờ kiến trúc GPU Enterprise.</p>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-all"
              >
                Hủy
              </button>
              <button
                onClick={saveSettings}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-200 dark:shadow-none transition-all"
              >
                Lưu cài đặt
              </button>
            </div>
          </>
        ) : settingsTab === 'guide' ? (
          <div className="p-4 md:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Google Gemini Guide */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4">
              <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-black">G</span>
                Google Gemini API Key
                <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">Miễn phí</span>
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black mt-0.5">1</span>
                  <span>Truy cập <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={10} /></a></span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black mt-0.5">2</span>
                  <span>Đăng nhập bằng tài khoản Google của bạn</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black mt-0.5">3</span>
                  <span>Nhấn nút <strong>"Create API Key"</strong> hoặc <strong>"Tạo API Key"</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black mt-0.5">4</span>
                  <span>Chọn project hoặc tạo mới → Nhấn <strong>"Create API key in existing project"</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black mt-0.5">5</span>
                  <span>Copy API Key (bắt đầu bằng <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[10px] font-mono text-blue-700 dark:text-blue-300">AIzaSy...</code>) → Dán vào ô Gemini</span>
                </li>
              </ol>
              <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-900/30">
                <p className="text-[10px] text-blue-500 dark:text-blue-400/70 font-medium">💡 Gói miễn phí: 15 request/phút, 1.500 request/ngày — đủ dùng cho cá nhân.</p>
              </div>
            </div>

            {/* OpenAI Guide */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs">🤖</span>
                OpenAI API Key (GPT-4o)
                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase">Trả phí</span>
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black mt-0.5">1</span>
                  <span>Truy cập <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5">OpenAI Platform <ExternalLink size={10} /></a> → Đăng ký hoặc đăng nhập</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black mt-0.5">2</span>
                  <span>Vào <a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5">Settings → Billing <ExternalLink size={10} /></a> → Nạp tối thiểu $5</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black mt-0.5">3</span>
                  <span>Vào <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5">API Keys <ExternalLink size={10} /></a> → Nhấn <strong>"Create new secret key"</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black mt-0.5">4</span>
                  <span>Đặt tên (VD: "CIC ERP") → Nhấn <strong>"Create secret key"</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black mt-0.5">5</span>
                  <span>Copy Key (bắt đầu bằng <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-700 dark:text-emerald-300">sk-proj-...</code>) → Dán vào ô OpenAI</span>
                </li>
              </ol>
              <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-900/30">
                <p className="text-[10px] text-emerald-500 dark:text-emerald-400/70 font-medium">⚠️ Key chỉ hiện 1 lần duy nhất. Hãy copy và lưu lại ngay!</p>
              </div>
            </div>

            {/* DeepSeek Guide */}
            <div className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/20 p-4">
              <h4 className="text-sm font-bold text-violet-700 dark:text-violet-400 flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs">🤔</span>
                DeepSeek API Key
                <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">Rẻ</span>
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-black mt-0.5">1</span>
                  <span>Truy cập <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 font-bold hover:underline inline-flex items-center gap-0.5">DeepSeek Platform <ExternalLink size={10} /></a> → Đăng ký / đăng nhập</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-black mt-0.5">2</span>
                  <span>Vào <a href="https://platform.deepseek.com/top_up" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 font-bold hover:underline inline-flex items-center gap-0.5">Top Up <ExternalLink size={10} /></a> → Nạp tiền (tối thiểu ~$2)</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-black mt-0.5">3</span>
                  <span>Vào <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 font-bold hover:underline inline-flex items-center gap-0.5">API Keys <ExternalLink size={10} /></a> → Nhấn <strong>"Create new API key"</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-black mt-0.5">4</span>
                  <span>Copy Key (bắt đầu bằng <code className="bg-violet-100 dark:bg-violet-900/40 px-1.5 py-0.5 rounded text-[10px] font-mono text-violet-700 dark:text-violet-300">sk-...</code>) → Dán vào ô DeepSeek</span>
                </li>
              </ol>
              <div className="mt-3 pt-3 border-t border-violet-200/50 dark:border-violet-900/30">
                <p className="text-[10px] text-violet-500 dark:text-violet-400/70 font-medium">💡 DeepSeek R1 rất rẻ (~$0.55/1M token input) — phù hợp cho phân tích chuyên sâu.</p>
              </div>
            </div>

            {/* Tips Section */}
            <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                💡 Mẹo bảo mật
              </h4>
              <ul className="space-y-1.5 text-[11px] text-amber-700/80 dark:text-amber-400/70 font-medium">
                <li className="flex gap-1.5">• API Key chỉ lưu trên trình duyệt của bạn, <strong>không gửi lên server</strong></li>
                <li className="flex gap-1.5">• Không bao giờ chia sẻ API Key cho người khác</li>
                <li className="flex gap-1.5">• Nên đặt giới hạn chi tiêu (spending limit) trên mỗi platform</li>
                <li className="flex gap-1.5">• Nếu nghi ngờ Key bị lộ, hãy <strong>xóa và tạo Key mới</strong> ngay</li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AISettingsModal;
