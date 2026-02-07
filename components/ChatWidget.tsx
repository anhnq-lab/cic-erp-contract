import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { querySystemDataWithDeepSeek } from '../services/openaiService';

interface ChatWidgetProps {
    contextData: any; // Data to be passed to AI for context
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ contextData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', text: 'Xin chào! Tôi có thể giúp gì cho bạn về dữ liệu hiện tại (DeepSeek Powered)?', sender: 'ai', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Simplify context data to reduce token usage if needed
            // For now, passing exactly what is provided, but typically you'd want to aggregate sensitive or large lists
            const response = await querySystemDataWithDeepSeek(input, contextData);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 h-[500px] bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-200">
                    {/* Header */}
                    <div className="p-4 bg-indigo-600 flex items-center justify-between text-white shadow-md">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <span className="font-semibold">Trợ lý AI</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-indigo-500 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3.5 rounded-lg text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-sm prose dark:prose-invert prose-sm max-w-none'
                                        }`}
                                >
                                    {msg.sender === 'user' ? (
                                        msg.text
                                    ) : (
                                        <div className="prose dark:prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 block" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-black text-indigo-700 dark:text-indigo-400" {...props} />,
                                                    table: ({ node, ...props }) => <div className="overflow-x-auto my-2 rounded-lg border border-slate-200 dark:border-slate-800"><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs" {...props} /></div>,
                                                    thead: ({ node, ...props }) => <thead className="bg-slate-50 dark:bg-slate-800" {...props} />,
                                                    th: ({ node, ...props }) => <th className="px-3 py-2 text-left font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider" {...props} />,
                                                    td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-nowrap border-t border-slate-100 dark:border-slate-800" {...props} />,
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg rounded-tl-sm border border-slate-100 dark:border-slate-800 shadow-sm flex gap-1">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Hỏi về dữ liệu..."
                                className="w-full pl-4 pr-10 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-xl transition-all duration-300 pointer-events-auto hover:scale-105 active:scale-95 flex items-center justify-center ${isOpen
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rotate-90 scale-0 opacity-0 absolute'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
                    }`}
            >
                <MessageCircle size={28} />
            </button>
            {/* Show Close Icon when open on top of the button, or just handle toggle logic cleaner. 
                Actually the UI design above hides the floater when open and shows the window. 
                Let's stick to: Floater is always there unless open? 
                Or: The window has a close button.
                Let's make the floater toggle.
             */}
            {!isOpen && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-4 h-4 bg-red-500 rounded-full animate-ping pointer-events-none" />
            )}
        </div>
    );
};

export default ChatWidget;
