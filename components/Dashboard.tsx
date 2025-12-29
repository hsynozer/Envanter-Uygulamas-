
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { InventoryStats, Server } from '../types';

interface DashboardProps {
  stats: InventoryStats;
  servers: Server[];
  onFilterChange: (filter: { key: keyof Server | 'eol' | 'unbacked' | 'orphaned' | 'needsPatching'; value: any; label: string } | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, servers, onFilterChange }) => {
  const osVersionData = Object.entries(stats.osVersionDistribution)
    .map(([name, value]) => ({ 
      name: name.length > 15 ? name.substring(0, 12) + '...' : name, 
      fullName: name,
      count: Number(value) 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const locData = Object.entries(stats.locationDistribution).map(([name, value]) => ({ name, value }));

  // Dinamik Risk Hesaplamaları
  const isEOL = (os: string, version: string) => {
    const v = (version || '').toLowerCase();
    const o = (os || '').toLowerCase();
    if (o.includes('linux')) {
      if (v.includes('14.04') || v.includes('16.04') || v.includes('18.04') || v.includes('cent') && (v.includes(' 6') || v.includes(' 7'))) return true;
    }
    if (o.includes('win') && (v.includes('2003') || v.includes('2008') || v.includes('2012'))) return true;
    return false;
  };

  const eolCount = servers.filter(s => isEOL(s.os, s.osVersion)).length;
  const unbackedCount = servers.filter(s => !s.isBackedUp).length;
  const orphanedCount = servers.filter(s => !s.owner || !s.department).length;
  
  // Yama riski: Son 90 günde yama almayanlar
  const patchingRiskCount = servers.filter(s => {
    if (!s.lastPatchedDate) return true;
    const lastPatch = new Date(s.lastPatchedDate);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return lastPatch < ninetyDaysAgo;
  }).length;

  const handleBarClick = (data: any, key: keyof Server) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const value = data.activePayload[0].payload.name;
      onFilterChange({ key, value, label: value });
    }
  };

  return (
    <div className="space-y-6 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1C1C1E] p-6 rounded-3xl shadow-xl border-b-4 border-[#FFD200] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FFD200]/10 rounded-full blur-2xl group-hover:bg-[#FFD200]/20 transition-all"></div>
          <h3 className="text-[#FFD200] text-[10px] font-black uppercase tracking-[0.2em] mb-2 italic">Toplam Envanter</h3>
          <div className="flex items-end space-x-2">
            <span className="text-5xl font-black text-white leading-none">{stats.totalServers}</span>
            <span className="text-[#FFD200] text-xs font-bold mb-1">ADET</span>
          </div>
          <div className="mt-4 flex space-x-2">
            <button onClick={() => onFilterChange({ key: 'os', value: 'Linux', label: 'Linux Sunucular' })} className="bg-white/10 hover:bg-white/20 text-white text-[9px] px-2 py-1 rounded font-bold transition-colors">{stats.linuxCount} LINUX</button>
            <button onClick={() => onFilterChange({ key: 'os', value: 'Windows', label: 'Windows Sunucular' })} className="bg-white/10 hover:bg-white/20 text-white text-[9px] px-2 py-1 rounded font-bold transition-colors">{stats.windowsCount} WIN</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Sistem Kaynakları</h3>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-2xl font-black text-black">{stats.totalCpu}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Toplam vCPU</p>
              </div>
              <div className="h-10 w-px bg-slate-100"></div>
              <div>
                <p className="text-2xl font-black text-black">{stats.totalRamGb.toFixed(0)}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Toplam RAM (GB)</p>
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-[#1C1C1E] h-full" style={{width: '70%'}}></div>
          </div>
        </div>

        <div 
          onClick={() => onFilterChange({ key: 'unbacked', value: true, label: 'Yedeksiz Sunucular' })}
          className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 cursor-pointer hover:border-orange-400 transition-all group"
        >
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-orange-500 transition-colors">Yedekleme Skoru</h3>
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 28} 
                        strokeDashoffset={2 * Math.PI * 28 * (1 - stats.backupRate / 100)} 
                        className={stats.backupRate > 90 ? 'text-green-500' : 'text-orange-500'} />
              </svg>
              <span className="absolute text-xs font-black text-black">%{stats.backupRate.toFixed(0)}</span>
            </div>
            <div>
              <p className="text-sm font-black text-black">Güvenli Bölge</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{stats.backupRate > 90 ? 'Eksiksiz' : 'Kritik Sunucular Var'}</p>
              <p className="text-[8px] text-orange-600 font-black mt-1 uppercase italic group-hover:underline">Listeyi Gör &rarr;</p>
            </div>
          </div>
        </div>

        <div className="bg-[#FFD200] p-6 rounded-3xl shadow-xl shadow-[#FFD200]/20 flex flex-col justify-between group cursor-default">
          <div className="flex justify-between items-start">
            <h3 className="text-black text-[10px] font-black uppercase tracking-[0.2em] italic">Haftalık Trend</h3>
            <svg className="w-5 h-5 text-black/30 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div className="h-12 w-full mt-2">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{ name: 'Pzt', v: 40 }, { name: 'Sal', v: 30 }, { name: 'Çar', v: 65 }, { name: 'Per', v: 45 }, { name: 'Cum', v: 90 }]}>
                  <Area type="monotone" dataKey="v" stroke="black" fill="transparent" strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
          <p className="text-black text-[10px] font-bold uppercase mt-2">Envanter Artış Hızı: <span className="font-black">+%12.4</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-[#1C1C1E] rounded-3xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-[#FFD200] font-black uppercase tracking-widest text-xs italic">TOP İŞLETİM SİSTEMLERİ</h3>
             <span className="text-[9px] text-white/40 font-bold">NESINE.TECH</span>
          </div>
          <div className="space-y-3">
            {osVersionData.map((os, idx) => (
              <div 
                key={idx} 
                className="flex items-center group cursor-pointer"
                onClick={() => onFilterChange({ key: 'osVersion', value: os.fullName, label: os.fullName })}
              >
                <div className="w-6 text-[#FFD200] font-black italic text-sm">{idx + 1}.</div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 flex justify-between items-center border border-white/5 group-hover:border-[#FFD200]/50 group-hover:bg-white/10 transition-all">
                  <span className="text-white text-xs font-bold uppercase tracking-tight">{os.fullName}</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                       <div className="bg-[#FFD200] h-full" style={{width: `${(os.count / stats.totalServers) * 100}%`}}></div>
                    </div>
                    <span className="text-[#FFD200] text-xs font-black">{os.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-red-600 p-8 rounded-3xl shadow-xl shadow-red-200 text-white flex flex-col">
           <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1 italic">Kritik Operasyonel Riskler</h3>
                <p className="text-3xl font-black uppercase italic">INFRA RISK MONITOR</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div 
                onClick={() => onFilterChange({ key: 'unbacked', value: true, label: 'Kritik: Yedeksiz Sunucular' })}
                className="bg-black/10 hover:bg-black/30 p-5 rounded-3xl border border-white/10 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between"
              >
                 <span className="text-[11px] font-black uppercase opacity-70 block">Yedeksiz</span>
                 <span className="text-4xl font-black mt-2">{unbackedCount}</span>
              </div>
              
              <div 
                onClick={() => onFilterChange({ key: 'eol', value: true, label: 'Kritik: EOL OS Sürümleri' })}
                className="bg-black/10 hover:bg-black/30 p-5 rounded-3xl border border-white/10 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between"
              >
                 <span className="text-[11px] font-black uppercase opacity-70 block">EOL OS</span>
                 <span className="text-4xl font-black mt-2">{eolCount}</span>
              </div>

              <div 
                onClick={() => onFilterChange({ key: 'orphaned', value: true, label: 'Risk: Sahipsiz Sunucular' })}
                className="bg-black/10 hover:bg-black/30 p-5 rounded-3xl border border-white/10 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between"
              >
                 <span className="text-[11px] font-black uppercase opacity-70 block">Sahipsiz</span>
                 <span className="text-4xl font-black mt-2">{orphanedCount}</span>
              </div>

              <div 
                onClick={() => onFilterChange({ key: 'needsPatching', value: true, label: 'Risk: Yama Bekleyenler (>90 Gün)' })}
                className="bg-black/10 hover:bg-black/30 p-5 rounded-3xl border border-white/10 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between"
              >
                 <span className="text-[11px] font-black uppercase opacity-70 block">Yama Bekleyen</span>
                 <span className="text-4xl font-black mt-2">{patchingRiskCount}</span>
              </div>
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest mt-6 opacity-50 italic">* Yama Bekleyenler: Son 90 gün içinde güncelleme almamış sunuculardır.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-black font-black uppercase tracking-widest text-xs flex items-center">
                <span className="w-3 h-5 bg-[#FFD200] rounded-sm mr-3 transform -skew-x-12"></span>
                vCenter Lokasyon Dağılımı
             </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={locData} 
                margin={{top: 20}}
                onClick={(data) => handleBarClick(data, 'vCenterName')}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#FFD20011'}} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                />
                <Bar dataKey="value" fill="#1C1C1E" radius={[12, 12, 0, 0]} barSize={50} style={{ cursor: 'pointer' }}>
                  {locData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1C1C1E' : '#FFD200'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
