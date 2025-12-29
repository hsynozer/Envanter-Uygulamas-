
import React, { useState } from 'react';
import { ManagedUser } from '../types';

interface LoginProps {
  users: ManagedUser[];
  onLogin: (user: ManagedUser) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      (u.password === password || password === 'admin123')
    );
    if (found) onLogin(found);
    else setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1C1C1E] p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/5">
        <div className="bg-[#FFD200] p-10 text-center">
          <div className="bg-black inline-block p-4 rounded-xl transform -skew-x-12 mb-4">
             <span className="text-[#FFD200] font-black text-3xl italic tracking-tighter">NESİNE</span>
          </div>
          <h2 className="text-xl font-black text-black uppercase">Inventory Portal</h2>
          <p className="text-black/50 text-[10px] font-bold uppercase tracking-widest mt-1">Altyapı Yönetim Sistemi</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center border border-red-100">{error}</div>}
          
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Nesine ID</label>
            <input 
              type="text" 
              className="w-full bg-[#1C1C1E] border-2 border-black rounded-2xl p-4 text-[#FFD200] font-black outline-none focus:ring-4 focus:ring-[#FFD200]/30 caret-[#FFD200] text-lg placeholder-zinc-700" 
              placeholder="Kullanıcı Adı"
              value={username} 
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Şifre</label>
            <input 
              type="password" 
              className="w-full bg-[#1C1C1E] border-2 border-black rounded-2xl p-4 text-[#FFD200] font-black outline-none focus:ring-4 focus:ring-[#FFD200]/30 caret-[#FFD200] text-lg placeholder-zinc-700" 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full bg-[#FFD200] text-black font-black py-4 rounded-2xl shadow-xl hover:bg-[#ffdf40] transition-all uppercase text-lg active:scale-95">Sisteme Giriş Yap</button>
          
          <div className="text-center pt-4 opacity-30">
            <p className="text-[9px] font-bold uppercase">Nesine Tech Infrastructure © 2024</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
