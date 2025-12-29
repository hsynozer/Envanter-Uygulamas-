import React, { useState } from 'react';
import { ManagedUser } from '../types';

interface LoginProps {
  users: ManagedUser[];
  onLogin: (user: ManagedUser) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const foundUser = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        (u.password === password || (!u.password && password === 'admin123'))
      );

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Hatalı kullanıcı adı veya şifre.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1C1C1E] p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5">
        <div className="bg-[#FFD200] p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-black/10"></div>
          <div className="bg-black inline-block p-4 rounded-2xl mb-4 transform -skew-x-12 shadow-xl">
             <span className="text-[#FFD200] font-black text-3xl italic tracking-tighter uppercase">NESİNE</span>
          </div>
          <h2 className="text-2xl font-black text-black tracking-tight uppercase">Inventory Portal</h2>
          <p className="text-black/60 text-xs font-bold mt-2 uppercase tracking-widest">Kurumsal Erişim Paneli</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center space-x-3 font-bold">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 bg-[#1C1C1E] border-2 border-black rounded-2xl focus:ring-4 focus:ring-[#FFD200]/30 focus:border-[#FFD200] outline-none transition-all font-black text-[#FFD200] text-lg caret-[#FFD200] placeholder-zinc-700"
              placeholder="Nesine ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Şifre</label>
            <input
              type="password"
              required
              className="w-full px-5 py-4 bg-[#1C1C1E] border-2 border-black rounded-2xl focus:ring-4 focus:ring-[#FFD200]/30 focus:border-[#FFD200] outline-none transition-all font-black text-[#FFD200] text-lg caret-[#FFD200] placeholder-zinc-700"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFD200] hover:bg-[#ffdf40] text-black font-black py-4 px-6 rounded-2xl shadow-2xl shadow-[#FFD200]/20 transition-all flex justify-center items-center space-x-3 text-lg active:scale-95 uppercase tracking-wider"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sisteme Giriş</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </>
            )}
          </button>
          
          <div className="text-center pt-4 border-t border-slate-100">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nesine.com Bilgi İşlem Altyapısı</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;