
import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Send, Copy, RefreshCw, AlertTriangle, Database, MessageSquare } from 'lucide-react';
import { analyzeContract, querySystemData } from '../services/geminiService';
import { MOCK_CONTRACTS } from '../constants';

const AIAssistant: React.FC = () => {
  const [mode, setMode] = useState<'doc' | 'query'>('doc');
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    let result;
    if (mode === 'doc') {
      result = await analyzeContract(inputText);
    } else {
      result = await querySystemData(inputText, MOCK_CONTRACTS.slice(0, 30));
    }
    setAnalysis(result || "Không có kết quả.");
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-[24px] text-white mb-6 shadow-xl shadow-indigo-200 dark:shadow-none animate-pulse">
          <BrainCircuit size={36} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Trung tâm Trí tuệ AI</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Sử dụng sức mạnh của Gemini 3 để quản trị dữ liệu thông minh.</p>
      </div>

      <div className="flex justify-center gap-4">
        <button 
          onClick={() => {setMode('doc'); setAnalysis(null); setInputText('');}}
          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'doc' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}
        >
          <MessageSquare size={16} /> Phân tích văn bản
        </button>
        <button 
          onClick={() => {setMode('query'); setAnalysis(null); setInputText('');}}
          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'query' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}
        >
          <Database size={16} /> Truy vấn hệ thống
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none relative group">
          <div className="absolute -top-3 -right-3">
             <div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-2">
                <Sparkles size={12} /> AI ACTIVE
             </div>
          </div>

          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            {mode === 'doc' ? 'Nội dung hợp đồng (Raw Text)' : 'Đặt câu hỏi cho Trợ lý AI'}
          </label>
          
          <textarea 
            className="w-full h-40 p-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-3xl focus:border-indigo-500 focus:outline-none transition-all text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium"
            placeholder={mode === 'doc' ? "Dán nội dung điều khoản vào đây để tóm tắt..." : "Ví dụ: 'Thống kê các hợp đồng có giá trị trên 1 tỷ đồng của DCS'..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
          
          <div className="mt-6 flex justify-between items-center">
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg uppercase border border-indigo-100 dark:border-indigo-800">Model: Flash 3</span>
               <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase border border-emerald-100 dark:border-emerald-800">Context: Live Data</span>
            </div>
            <button 
              onClick={handleProcess}
              disabled={isAnalyzing || !inputText.trim()}
              className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xl shadow-indigo-100 dark:shadow-none group-hover:scale-105"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Thực hiện AI
                </>
              )}
            </button>
          </div>
        </div>

        {analysis && (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border-2 border-indigo-50 dark:border-indigo-900/20 shadow-2xl animate-in slide-in-from-top-8 duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <button 
                onClick={() => navigator.clipboard.writeText(analysis)}
                className="p-3 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all"
              >
                <Copy size={22} />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-[18px] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Kết quả phân tích</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Thời gian phản hồi: 1.2s</p>
              </div>
            </div>
            
            <div className="prose prose-indigo dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed text-base font-medium">
                {analysis}
              </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-start gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Cảnh báo Trách nhiệm</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kết quả được tối ưu bởi AI dựa trên dữ liệu hiện có. Vui lòng kiểm tra lại các mốc thời gian và giá trị quan trọng.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
