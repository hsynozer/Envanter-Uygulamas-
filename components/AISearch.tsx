
import React, { useState } from 'react';
import { Server } from '../types';
import { analyzeInventory } from '../services/geminiService';

interface AISearchProps {
  servers: Server[];
}

const AISearch: React.FC<AISearchProps> = ({ servers }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult('');
    const response = await analyzeInventory(servers, query);
    setResult(response || 'Yanıt alınamadı.');
    setLoading(false);
  };

  return (
    <div className="bg-[#1C1C1E] text-white rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD200]/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-[#FFD200]/10"></div>
      
      <div className="flex items-center space-x-4 mb-6 relative z-10">
        <div className="p-3 bg-[#FFD200] rounded-xl shadow-[0_0_20px_rgba(255,210,0,0.3)]">
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black italic tracking-tighter uppercase">AI Infrastructure Analyst</h3>
          <p className="text-[#FFD200] text-[10px] font-bold uppercase tracking-widest opacity-80">Powered by Nesine Tech</p>
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="relative mb-4 z-10">
        <input
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 pr-14 focus:ring-4 focus:ring-[#FFD200]/20 focus:border-[#FFD200] outline-none placeholder-slate-500 transition-all font-semibold text-lg"
          placeholder="Örn: 'En eski işletim sistemine sahip 5 sunucuyu listele'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-3 top-3 p-3 bg-[#FFD200] text-black rounded-xl hover:bg-[#ffdf40] transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </form>

      {result && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap animate-fadeIn z-10 relative">
          <div className="flex items-center space-x-2 mb-2 opacity-50">
             <div className="w-1.5 h-1.5 bg-[#FFD200] rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest">Analiz Sonucu</span>
          </div>
          {result}
        </div>
      )}
    </div>
  );
};

export default AISearch;
