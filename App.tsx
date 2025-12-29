import React, { useState, useEffect, useMemo } from 'react';
import { Server, InventoryStats, ManagedUser, InfrastructureType, VCenter } from './types';
import Dashboard from './components/Dashboard';
import ServerForm from './components/ServerForm';
import ImportModal from './components/ImportModal';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import VCenterManagement from './components/VCenterManagement';
import ProfileModal from './components/ProfileModal';
import AISearch from './components/AISearch';

type FilterType = {
  key: keyof Server | 'eol' | 'unbacked' | 'orphaned' | 'needsPatching';
  value: any;
  label: string;
} | null;

const App: React.FC = () => {
  const [user, setUser] = useState<ManagedUser | null>(() => {
    const saved = localStorage.getItem('inventory_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(() => {
    const saved = localStorage.getItem('inventory_managed_users');
    return saved ? JSON.parse(saved) : [{ 
      id: '1', 
      username: 'admin', 
      fullName: 'Nesine Admin', 
      role: 'admin', 
      password: 'admin123', 
      department: 'IT Infrastructure', 
      lastLogin: '' 
    }];
  });

  const [servers, setServers] = useState<Server[]>(() => {
    const saved = localStorage.getItem('inventory_servers');
    return saved ? JSON.parse(saved) : [];
  });

  const [vCenters, setVCenters] = useState<VCenter[]>(() => {
    const saved = localStorage.getItem('inventory_vcenters');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'VC-ISTANBUL-01', location: 'Istanbul' },
      { id: '2', name: 'VC-ANKARA-01', location: 'Ankara' }
    ];
  });

  const [activeTab, setActiveTab] = useState<'inventory' | 'users' | 'vcenters'>('inventory');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [filterOS, setFilterOS] = useState<string>('All');
  const [dashboardFilter, setDashboardFilter] = useState<FilterType>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user) localStorage.setItem('inventory_user', JSON.stringify(user));
    localStorage.setItem('inventory_managed_users', JSON.stringify(managedUsers));
    localStorage.setItem('inventory_servers', JSON.stringify(servers));
    localStorage.setItem('inventory_vcenters', JSON.stringify(vCenters));
  }, [servers, user, managedUsers, vCenters]);

  const handleLogin = (loginInfo: ManagedUser) => {
    const updatedUser = { ...loginInfo, lastLogin: new Date().toISOString() };
    setManagedUsers(prev => prev.map(u => u.id === loginInfo.id ? updatedUser : u));
    setUser(updatedUser);
  };

  const handleImportServers = (importedServers: Server[]) => {
    setServers(prev => [...prev, ...importedServers]);
    setIsImportOpen(false);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterOS('All');
    setDashboardFilter(null);
  };

  const isEOL = (os: string, version: string) => {
    const v = (version || '').toLowerCase();
    const o = (os || '').toLowerCase();
    if (o.includes('linux')) {
      if (v.includes('14.04') || v.includes('16.04') || v.includes('18.04') || (v.includes('cent') && (v.includes(' 6') || v.includes(' 7')))) return true;
    }
    if (o.includes('win') && (v.includes('2003') || v.includes('2008') || v.includes('2012'))) return true;
    return false;
  };

  const isOrphaned = (s: Server) => !s.owner || !s.department;

  const needsPatching = (s: Server) => {
    if (!s.lastPatchedDate) return true;
    const lastPatch = new Date(s.lastPatchedDate);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return lastPatch < ninetyDaysAgo;
  };

  const filteredServers = useMemo(() => {
    return servers.filter(s => {
      if (dashboardFilter) {
        if (dashboardFilter.key === 'unbacked' && s.isBackedUp) return false;
        if (dashboardFilter.key === 'eol' && !isEOL(s.os, s.osVersion)) return false;
        if (dashboardFilter.key === 'orphaned' && !isOrphaned(s)) return false;
        if (dashboardFilter.key === 'needsPatching' && !needsPatching(s)) return false;
        
        if (dashboardFilter.key === 'vCenterName' && s.vCenterName !== dashboardFilter.value) {
            const vc = vCenters.find(v => v.name === s.vCenterName);
            if (vc?.location !== dashboardFilter.value && s.vCenterName !== dashboardFilter.value) return false;
        }
        if (dashboardFilter.key === 'osVersion' && `${s.os} ${s.osVersion}`.trim() !== dashboardFilter.value) return false;
        if (dashboardFilter.key === 'infraType' && s.infraType !== dashboardFilter.value) return false;
        if (dashboardFilter.key === 'os' && s.os !== dashboardFilter.value) return false;
      }

      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(lowerSearch) || 
                           s.ipAddress.includes(searchTerm) ||
                           s.owner.toLowerCase().includes(lowerSearch) ||
                           s.department.toLowerCase().includes(lowerSearch) ||
                           s.vCenterName.toLowerCase().includes(lowerSearch);
      const matchesOS = filterOS === 'All' || s.os === filterOS;
      
      return matchesSearch && matchesOS;
    });
  }, [servers, searchTerm, filterOS, dashboardFilter, vCenters]);

  const stats: InventoryStats = useMemo(() => {
    const total = servers.length;
    let totalCpu = 0;
    let totalRamGb = 0;
    const osVerDist: Record<string, number> = {};
    const vcDist: Record<string, number> = {};
    const locDist: Record<string, number> = {};
    const infraDist: Record<string, number> = { 'Virtual': 0, 'Physical': 0 };
    
    servers.forEach(s => {
      totalCpu += parseInt(s.cpu) || 0;
      const ramVal = parseFloat(s.memory.split(' ')[0]) || 0;
      totalRamGb += s.memory.toLowerCase().includes('mb') ? ramVal / 1024 : ramVal;
      const osFull = `${s.os} ${s.osVersion}`.trim() || 'Unknown';
      osVerDist[osFull] = (osVerDist[osFull] || 0) + 1;
      vcDist[s.vCenterName] = (vcDist[s.vCenterName] || 0) + 1;
      infraDist[s.infraType] = (infraDist[s.infraType] || 0) + 1;
      const vcObj = vCenters.find(vc => vc.name === s.vCenterName);
      const loc = vcObj?.location || 'Unassigned';
      locDist[loc] = (locDist[loc] || 0) + 1;
    });

    return {
      totalServers: total,
      linuxCount: servers.filter(s => s.os === 'Linux').length,
      windowsCount: servers.filter(s => s.os === 'Windows').length,
      backupRate: total > 0 ? (servers.filter(s => s.isBackedUp).length / total) * 100 : 0,
      totalCpu,
      totalRamGb,
      vCenterDistribution: vcDist,
      locationDistribution: locDist,
      infraDistribution: infraDist,
      osVersionDistribution: osVerDist
    };
  }, [servers, vCenters]);

  if (!user) return <Login users={managedUsers} onLogin={handleLogin} />;

  return (
    <div className="min-h-screen pb-40 bg-slate-50 relative">
      <nav className="bg-[#1C1C1E] border-b border-white/10 sticky top-0 z-40 shadow-xl">
        <div className="max-w-[100%] mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="bg-[#FFD200] p-1.5 rounded-lg text-black font-black text-xl italic px-3 shadow-lg transform -skew-x-12 cursor-pointer" onClick={() => setActiveTab('inventory')}>
                  NESİNE
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block border-l border-white/20 pl-4 uppercase italic">Infrascan Portal</h1>
              </div>
              <div className="hidden md:flex space-x-1">
                <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'text-[#FFD200] bg-white/5' : 'text-slate-400 hover:text-white'}`}>Envanter</button>
                {isAdmin && <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users' ? 'text-[#FFD200] bg-white/5' : 'text-slate-400 hover:text-white'}`}>Kullanıcılar</button>}
                {isAdmin && <button onClick={() => setActiveTab('vcenters')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'vcenters' ? 'text-[#FFD200] bg-white/5' : 'text-slate-400 hover:text-white'}`}>vCenters</button>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && activeTab === 'inventory' && (
                <div className="flex space-x-3">
                  <button onClick={() => setIsImportOpen(true)} className="px-3 py-1.5 text-slate-300 hover:text-[#FFD200] text-sm font-medium transition-colors">Dışarıdan Aktar</button>
                  <button onClick={() => { setEditingServer(null); setIsFormOpen(true); }} className="bg-[#FFD200] text-black px-4 py-2 rounded-lg text-sm font-bold shadow-lg uppercase">Sunucu Ekle</button>
                </div>
              )}
              <button onClick={() => setIsProfileOpen(true)} className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <div className="w-7 h-7 rounded-full bg-[#FFD200] flex items-center justify-center text-black font-black text-xs">{user.fullName.charAt(0)}</div>
                <span className="text-xs font-bold text-white hidden md:block">{user.fullName}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[100%] mx-auto mt-8 px-4">
        {activeTab === 'inventory' ? (
          <>
            <AISearch servers={servers} />
            <Dashboard 
              stats={stats} 
              servers={servers}
              onFilterChange={(filter) => {
                setDashboardFilter(filter);
                document.getElementById('inventory-table-area')?.scrollIntoView({ behavior: 'smooth' });
              }} 
            />
            
            <div id="inventory-table-area" className="scroll-mt-20">
               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <input type="text" placeholder="Sunucu adı, IP, Birim veya Sahibi ile ara..." className="w-full px-10 py-3 border-2 border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-[#FFD200]/10 focus:border-[#FFD200] transition-all font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <select className="flex-1 md:flex-none px-4 py-3 border-2 border-slate-100 rounded-xl text-sm bg-white outline-none font-bold min-w-[120px]" value={filterOS} onChange={(e) => setFilterOS(e.target.value)}>
                      <option value="All">Tüm OS</option>
                      <option value="Linux">Linux</option>
                      <option value="Windows">Windows</option>
                    </select>
                    <button onClick={clearAllFilters} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                      Filtreleri Temizle
                    </button>
                  </div>
               </div>

               {dashboardFilter && (
                 <div className="mb-4 flex items-center space-x-2 animate-fadeIn">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif Filtre:</span>
                   <div className="bg-[#FFD200] text-black px-3 py-1 rounded-full flex items-center space-x-2 shadow-sm">
                      <span className="text-xs font-black uppercase tracking-tighter">{dashboardFilter.label}</span>
                      <button onClick={() => setDashboardFilter(null)} className="hover:bg-black/10 rounded-full p-0.5">&times;</button>
                   </div>
                 </div>
               )}
               
               <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1800px]">
                      <thead>
                        <tr className="bg-[#1C1C1E] text-[#FFD200] uppercase italic">
                          <th className="px-4 py-4 w-10">
                            <input type="checkbox" className="w-4 h-4 accent-[#FFD200]" checked={filteredServers.length > 0 && selectedIds.size === filteredServers.length} onChange={() => {
                              if (selectedIds.size === filteredServers.length) setSelectedIds(new Set());
                              else setSelectedIds(new Set(filteredServers.map(s => s.id)));
                            }} />
                          </th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">Sunucu Adı</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">IP Adresi</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">OS</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">OS Versiyon</th>
                          {/* YENİ SIRALAMA */}
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">CPU</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">RAM</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">Disk</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">VCenter Ismi</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">Kurulum Tarihi</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">Birim (Ekip)</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">Sahibi</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest">Teknik Ekip</th>
                          <th className="px-4 py-4 text-[10px] font-black tracking-widest text-center">Yedek</th>
                          {isAdmin && <th className="px-4 py-4 text-[10px] font-black tracking-widest text-right">İşlem</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredServers.map(server => (
                          <tr key={server.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-4 py-4">
                               <input type="checkbox" className="w-4 h-4 accent-[#FFD200]" checked={selectedIds.has(server.id)} onChange={() => {
                                 const next = new Set(selectedIds);
                                 if (next.has(server.id)) next.delete(server.id);
                                 else next.add(server.id);
                                 setSelectedIds(next);
                               }} />
                            </td>
                            <td className="px-4 py-4 text-sm font-black text-black group-hover:text-blue-600 transition-colors uppercase">{server.name}</td>
                            <td className="px-4 py-4 text-xs font-mono font-bold">{server.ipAddress}</td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${server.os === 'Linux' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{server.os}</span>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">{server.osVersion}</td>
                            
                            {/* YENİ SIRALAMA VERİLERİ */}
                            <td className="px-4 py-4 text-xs font-black">{server.cpu} Core</td>
                            <td className="px-4 py-4 text-xs font-black">{server.memory}</td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-400">{server.disk}</td>

                            <td className="px-4 py-4 text-xs font-black text-slate-400">{server.vCenterName}</td>
                            <td className="px-4 py-4 text-xs">{server.installationDate}</td>
                            <td className="px-4 py-4 text-xs font-bold">{server.department || '-'}</td>
                            <td className="px-4 py-4 text-xs font-black italic">{server.owner || '-'}</td>
                            <td className="px-4 py-4 text-xs">{server.techTeam || '-'}</td>
                            
                            <td className="px-4 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${server.isBackedUp ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{server.isBackedUp ? 'AKTİF' : 'YOK'}</span>
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-4 text-right">
                                <button onClick={() => { setEditingServer(server); setIsFormOpen(true); }} className="px-3 py-1.5 bg-slate-100 hover:bg-[#FFD200] hover:text-black rounded-lg text-[10px] font-black uppercase transition-all">Düzenle</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredServers.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <p className="text-slate-400 font-bold">Kriterlere uygun sunucu bulunamadı.</p>
                       <button onClick={clearAllFilters} className="mt-4 text-[#FFD200] bg-black px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Filtreleri Sıfırla</button>
                    </div>
                  )}
               </div>
            </div>
          </>
        ) : activeTab === 'users' ? (
          <UserManagement users={managedUsers} onUpdateUser={(id, data) => setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))} onDeleteUser={(id) => setManagedUsers(prev => prev.filter(u => u.id !== id))} onAddUser={(data) => setManagedUsers(prev => [...prev, { ...data as any, id: Date.now().toString(), lastLogin: '' }])} currentUser={user!} />
        ) : (
          <VCenterManagement vCenters={vCenters} onAdd={(name, loc) => setVCenters(prev => [...prev, { id: Date.now().toString(), name, location: loc }])} onUpdate={(id, name, loc) => setVCenters(prev => prev.map(vc => vc.id === id ? { ...vc, name, location: loc } : vc))} onDelete={(id) => setVCenters(prev => prev.filter(vc => vc.id !== id))} />
        )}
      </main>

      {selectedIds.size > 0 && activeTab === 'inventory' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 animate-bounceIn">
          <div className="bg-[#1C1C1E] text-white p-5 rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center space-x-4 border-r border-white/10 pr-6">
              <div className="bg-[#FFD200] text-black w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-lg transform -skew-x-12">
                {selectedIds.size}
              </div>
              <span className="text-sm font-bold uppercase italic tracking-tighter">Seçili Kayıt</span>
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <button onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setServers(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, lastPatchedDate: today, updatedAt: new Date().toISOString() } : s));
                setSelectedIds(new Set());
              }} className="bg-white/5 hover:bg-[#FFD200] hover:text-black px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase">TOPLU YAMA</button>
              <button onClick={() => {
                if (window.confirm(`${selectedIds.size} adet sunucu silinecek?`)) {
                  setServers(prev => prev.filter(s => !selectedIds.has(s.id)));
                  setSelectedIds(new Set());
                }
              }} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase">SİL</button>
            </div>
            <button onClick={() => setSelectedIds(new Set())} className="text-white/30 hover:text-white font-bold text-xs uppercase mr-4">Vazgeç</button>
          </div>
        </div>
      )}

      {isAdmin && (
        <>
          <ServerForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingServer(null); }} onSubmit={(data) => {
            if (editingServer) setServers(prev => prev.map(s => s.id === editingServer.id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
            else setServers(prev => [...prev, { ...data as Server, id: Date.now().toString(), updatedAt: new Date().toISOString() }]);
            setIsFormOpen(false); setEditingServer(null);
          }} onDelete={(id) => {
            setServers(prev => prev.filter(s => s.id !== id));
            setIsFormOpen(false);
          }} initialData={editingServer} vCenters={vCenters} />
          <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={handleImportServers} />
        </>
      )}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user!} onUpdate={(data) => setUser(prev => prev ? { ...prev, ...data } : null)} />
    </div>
  );
};

export default App;