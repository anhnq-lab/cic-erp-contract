
import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  StopCircle,
  Scale,
  PenTool,
  BarChart3
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamEnterpriseAI } from '../services/aiService';
import { getBusinessContext } from '../services/contextService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
}

type AgentType = 'general' | 'legal' | 'drafter' | 'analyst';

const AGENTS: Record<AgentType, { name: string; role: string; color: string; icon: any; prompt: string }> = {
  general: {
    name: 'Tổng quát',
    role: 'Trợ lý ảo Enterprise',
    color: 'bg-indigo-600',
    icon: Sparkles,
    prompt: 'Bạn là Trợ lý AI Enterprise. Trả lời ngắn gọn, chuyên nghiệp, hỗ trợ mọi tác vụ quản trị.'
  },
  legal: {
    name: 'Pháp chế & Rủi ro',
    role: 'Chuyên gia Pháp lý',
    color: 'bg-rose-600',
    icon: Scale,
    prompt: 'Bạn là Chuyên gia Pháp chế cao cấp. Nhiệm vụ: Rà soát hợp đồng, cảnh báo rủi ro pháp lý, trích dẫn Luật Đấu thầu/Xây dựng/Dân sự Việt Nam. Phong cách: Nghiêm túc, chính xác, cảnh báo rõ ràng.'
  },
  drafter: {
    name: 'Soạn thảo',
    role: 'Thư ký Điều hành',
    color: 'bg-emerald-600',
    icon: PenTool,
    prompt: 'Bạn là Thư ký Điều hành chuyên nghiệp. Nhiệm vụ: Soạn thảo email, công văn, tờ trình, phụ lục hợp đồng. Output: Format chuẩn văn bản hành chính, ngôn từ trang trọng, lịch sự.'
  },
  analyst: {
    name: 'Phân tích số liệu',
    role: 'Chuyên gia Dữ liệu',
    color: 'bg-amber-600',
    icon: BarChart3,
    prompt: 'Bạn là Chuyên gia Phân tích Dữ liệu. Nhiệm vụ: Phân tích xu hướng tài chính, KPI, dòng tiền. Format: Dùng bảng (Table) để so sánh số liệu, đưa ra nhận định (Insights) dựa trên data.'
  }
};

const AIAssistant: React.FC = () => {
  const [currentAgent, setCurrentAgent] = useState<AgentType>('general');
  const [currentModel, setCurrentModel] = useState<string>('gemini-1.5-flash');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Xin chào! Tôi là Trợ lý AI Enterprise của bạn. \n\nTôi có thể giúp gì cho bạn hôm nay? (Ví dụ: Tra cứu hợp đồng, Phân tích rủi ro, hoặc Thống kê doanh thu)',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const [systemContext, setSystemContext] = useState<string>('');

  useEffect(() => {
    // Pre-fetch business context specifically for AI
    getBusinessContext().then(ctx => setSystemContext(ctx));
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      role: 'model',
      content: '',
      isStreaming: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);

    try {
      // Prepare history
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // COMPOSE SYSTEM PROMPT WITH CONTEXT
      // If the agent is 'general' or 'analyst', we inject the financial data.
      // Other agents might not need it as much, but 'general' definitely does.
      let finalPrompt = AGENTS[currentAgent].prompt;

      if (['general', 'analyst', 'legal'].includes(currentAgent)) {
        finalPrompt = `${systemContext}\n\n${finalPrompt}`;
      }

      // Pass the selected agent's prompt as system instruction AND selected model
      const stream = streamEnterpriseAI(history, userMsg.content, currentModel, finalPrompt);

      let fullContent = '';

      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => prev.map(m =>
          m.id === botMsgId
            ? { ...m, content: fullContent }
            : m
        ));
      }

      setMessages(prev => prev.map(m =>
        m.id === botMsgId
          ? { ...m, isStreaming: false }
          : m
      ));

    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => prev.map(m =>
        m.id === botMsgId
          ? { ...m, content: fullContent + "\n\n⚠️ Đã xảy ra lỗi kết nối.", isStreaming: false }
          : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm('Xóa toàn bộ lịch sử chat?')) {
      setMessages([messages[0]]);
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300",
      isFullScreen ? "fixed inset-0 z-50 rounded-none m-0" : "rounded-[24px] h-[92vh] w-full max-w-7xl mx-auto my-2 relative"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none animate-pulse">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              Trợ lý AI Enterprise
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">v3.0</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-full animate-pulse", AGENTS[currentAgent].color.replace('bg-', 'text-current bg-'))}></span>
              {AGENTS[currentAgent].name} • {AGENTS[currentAgent].role}
            </p>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(Object.entries(AGENTS) as [AgentType, typeof AGENTS[AgentType]][]).map(([key, agent]) => {
            const Icon = agent.icon;
            const isActive = currentAgent === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setCurrentAgent(key);
                  setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    content: `**Đã chuyển sang chế độ: ${agent.name}**\n${agent.prompt.split('.')[1] || ''}`, // Brief intro
                    timestamp: new Date()
                  }]);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all",
                  isActive
                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
                title={agent.role}
              >
                <Icon size={14} className={isActive ? agent.color.replace('bg-', 'text-') : ''} />
                {agent.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">


          <button
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
            title="Xóa lịch sử"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
            title={isFullScreen ? "Thu nhỏ" : "Toàn màn hình"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-4 max-w-[90%] md:max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
              msg.role === 'user'
                ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                : "bg-indigo-600 border-transparent text-white shadow-md shadow-indigo-200 dark:shadow-none"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className={cn(
              "group relative px-6 py-4 rounded-[24px] text-sm leading-relaxed shadow-sm",
              msg.role === 'user'
                ? "bg-indigo-600 text-white rounded-tr-none"
                : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none"
            )}>
              {msg.role === 'model' ? (
                <div className="markdown-body">
                  {msg.content === '' && msg.isStreaming ? (
                    <span className="flex gap-1 items-center h-5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                    </span>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="prose prose-sm prose-indigo dark:prose-invert max-w-none break-words"
                      components={{
                        table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg" {...props} /></div>,
                        th: ({ node, ...props }) => <th className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-left text-xs font-bold uppercase tracking-wider text-slate-500" {...props} />,
                        td: ({ node, ...props }) => <td className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-sm" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-rose-500" {...props} />,
                        a: ({ node, ...props }) => <a className="text-indigo-600 hover:underline font-bold" target="_blank" rel="noopener noreferrer" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              {msg.role === 'model' && !msg.isStreaming && (
                <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
                    title="Copy"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <Bot size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-400 font-medium">Bắt đầu cuộc trò chuyện với AI</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="relative max-w-4xl mx-auto">
          {/* Model Selector (Compact) */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
            <select
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className="bg-slate-200/50 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 py-1.5 px-2 rounded-lg cursor-pointer focus:outline-none border border-transparent hover:border-indigo-200 transition-all max-w-[110px]"
              title="Chọn Model AI"
            >
              <option value="gemini-2.0-flash">✨ Gemini 2.0 (Newest)</option>
              <option value="gemini-1.5-flash">⚡ Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">🧠 Gemini 1.5 Pro</option>
              <option value="gpt-4o">🤖 GPT-4o</option>
              <option value="deepseek-r1">🤔 DeepSeek R1</option>
            </select>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi của bạn (Shift+Enter để xuống dòng)..."
            className="w-full pl-32 pr-14 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-[24px] resize-none max-h-40 min-h-[60px] shadow-sm text-sm font-medium focus:outline-none transition-all"
            rows={1}
            style={{ height: 'auto', minHeight: '60px' }}
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isTyping
                ? "bg-indigo-600 text-white shadow-lg hover:scale-105 active:scale-95"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
          >
            {isTyping ? <StopCircle size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
          AI có thể mắc lỗi. Vui lòng kiểm tra lại các thông tin quan trọng.
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
