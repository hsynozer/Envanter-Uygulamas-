
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
  const [filterBackup, setFilterBackup] = useState<string>('All');
  
  // Seçim Durumu
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<'none' | 'vcenter' | 'department'>('none');
  const [bulkValue, setBulkValue] = useState('');
  
  const [dashboardFilter, setDashboardFilter] = useState<FilterType>(null);

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

  const handleDeleteServer = (id: string) => {
    if (window.confirm('Bu sunucuyu silmek istediğinize emin misiniz?')) {
      setServers(prev => prev.filter(s => s.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (editingServer?.id === id) setEditingServer(null);
    }
  };

  const handleAddVCenter = (name: string, location: string) => {
    setVCenters(prev => [...prev, { id: Date.now().toString(), name, location }]);
  };

  const handleUpdateVCenter = (id: string, name: string, location: string) => {
    const oldName = vCenters.find(vc => vc.id === id)?.name;
    setVCenters(prev => prev.map(vc => vc.id === id ? { ...vc, name, location } : vc));
    if (oldName && oldName !== name) {
      setServers(prev => prev.map(s => s.vCenterName === oldName ? { ...s, vCenterName: name } : s));
    }
  };

  const handleDeleteVCenter = (id: string) => {
    setVCenters(prev => prev.filter(vc => vc.id !== id));
  };

  const handleImportServers = (newServers: Server[]) => {
    setServers(prev => {
      const existingIps = new Set(prev.map(s => s.ipAddress));
      const toAdd = newServers.filter(s => !existingIps.has(s.ipAddress));
      return [...prev, ...toAdd];
    });
  };

  // --- GENİŞLETİLMİŞ TOPLU İŞLEM FONKSİYONLARI ---

  const handleBulkPatch = () => {
    if (selectedIds.size === 0) return;
    const today = new Date().toISOString().split('T')[0];
    setServers(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, lastPatchedDate: today, updatedAt: new Date().toISOString() } : s));
    setSelectedIds(new Set());
    setBulkMode('none');
    alert(`${selectedIds.size} sunucu güncellendi.`);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`${selectedIds.size} adet sunucu envanterden kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?`)) {
      setServers(prev => prev.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      setBulkMode('none');
    }
  };

  const handleBulkUpdateVCenter = () => {
    if (!bulkValue) return;
    setServers(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, vCenterName: bulkValue, updatedAt: new Date().toISOString() } : s));
    setSelectedIds(new Set());
    setBulkMode('none');
    setBulkValue('');
  };

  const handleBulkUpdateDepartment = () => {
    if (!bulkValue) return;
    setServers(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, department: bulkValue, updatedAt: new Date().toISOString() } : s));
    setSelectedIds(new Set());
    setBulkMode('none');
    setBulkValue('');
  };

  const handleBulkToggleBackup = (status: boolean) => {
    setServers(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, isBackedUp: status, updatedAt: new Date().toISOString() } : s));
    setSelectedIds(new Set());
    setBulkMode('none');
  };

  // --- KONTROLLER ---

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
      const matchesBackup = filterBackup === 'All' || 
                           (filterBackup === 'Yes' && s.isBackedUp) || 
                           (filterBackup === 'No' && !s.isBackedUp);
      return matchesSearch && matchesOS && matchesBackup;
    });
  }, [servers, searchTerm, filterOS, filterBackup, dashboardFilter, vCenters]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredServers.length && filteredServers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredServers.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="bg-[#FFD200] p-1.5 rounded-lg text-black font-black text-xl italic px-3 shadow-lg transform -skew-x-12 cursor-pointer" onClick={() => setActiveTab('inventory')}>
                  NESİNE
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block border-l border-white/20 pl-4">Inventory</h1>
              </div>
              <div className="hidden md:flex space-x-1 border-white/10 pl-4">
                <button onClick={() => { setActiveTab('inventory'); setSelectedIds(new Set()); setBulkMode('none'); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'text-[#FFD200] bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Envanter</button>
                {isAdmin && <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users' ? 'text-[#FFD200] bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Kullanıcılar</button>}
                {isAdmin && <button onClick={() => setActiveTab('vcenters')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'vcenters' ? 'text-[#FFD200] bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>vCenter Yönetimi</button>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && activeTab === 'inventory' && (
                <div className="hidden sm:flex space-x-3">
                  <button onClick={() => setIsImportOpen(true)} className="px-3 py-1.5 text-slate-300 hover:text-[#FFD200] text-sm font-medium transition-colors flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>Toplu Ekle</span>
                  </button>
                  <button onClick={() => { setEditingServer(null); setIsFormOpen(true); }} className="bg-[#FFD200] hover:bg-[#ffdf40] text-black px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center space-x-2 transition-all active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>Sunucu Ekle</span>
                  </button>
                </div>
              )}
              <button onClick={() => setIsProfileOpen(true)} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10">
                <div className="w-7 h-7 rounded-full bg-[#FFD200] flex items-center justify-center text-black font-black text-xs">{user.fullName.charAt(0)}</div>
                <span className="text-xs font-bold text-white hidden md:block">{user.fullName}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* GELİŞMİŞ TOPLU İŞLEM PANELİ (BULK COMMAND CENTER) */}
      {selectedIds.size > 0 && activeTab === 'inventory' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 animate-bounceIn">
          <div className="bg-[#1C1C1E] text-white p-5 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center space-x-4 border-r border-white/10 pr-6">
              <div className="bg-[#FFD200] text-black w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(255,210,0,0.3)] transform -skew-x-12">
                {selectedIds.size}
              </div>
              <div>
                <span className="text-[#FFD200] text-[10px] font-black uppercase tracking-widest block">SEÇİLİ</span>
                <span className="text-sm font-bold whitespace-nowrap">SUNUCU</span>
              </div>
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-2">
              {bulkMode === 'none' ? (
                <>
                  <button onClick={handleBulkPatch} className="bg-white/5 hover:bg-[#FFD200] hover:text-black px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all flex items-center space-x-2 border border-white/10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>YAMA UYGULA</span>
                  </button>
                  <button onClick={() => setBulkMode('vcenter')} className="bg-white/5 hover:bg-blue-500 hover:text-white px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all flex items-center space-x-2 border border-white/10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                    <span>VCENTER DEĞİŞTİR</span>
                  </button>
                  <button onClick={() => setBulkMode('department')} className="bg-white/5 hover:bg-purple-500 hover:text-white px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all flex items-center space-x-2 border border-white/10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    <span>BİRİM GÜNCELLE</span>
                  </button>
                  <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                    <button onClick={() => handleBulkToggleBackup(true)} className="px-3 py-1.5 rounded-xl text-[9px] font-black hover:bg-green-500 hover:text-white transition-all uppercase">YEDEKLE</button>
                    <button onClick={() => handleBulkToggleBackup(false)} className="px-3 py-1.5 rounded-xl text-[9px] font-black hover:bg-red-500 hover:text-white transition-all uppercase">YEDEĞİ KES</button>
                  </div>
                  <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-2xl text-[11px] font-black transition-all flex items-center space-x-2 shadow-lg shadow-red-900/40">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    <span>TOPLU SİL</span>
                  </button>
                </>
              ) : bulkMode === 'vcenter' ? (
                <div className="flex items-center space-x-3 w-full animate-fadeIn">
                  <span className="text-xs font-bold text-blue-400 uppercase italic">Yeni vCenter Seçiniz:</span>
                  <select 
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                  >
                    <option value="" className="text-black">vCenter Seç...</option>
                    {vCenters.map(vc => <option key={vc.id} value={vc.name} className="text-black">{vc.name}</option>)}
                  </select>
                  <button onClick={handleBulkUpdateVCenter} disabled={!bulkValue} className="bg-blue-600 px-6 py-2 rounded-xl text-xs font-black uppercase disabled:opacity-50">ONAYLA</button>
                  <button onClick={() => setBulkMode('none')} className="text-xs font-bold text-white/50 hover:text-white">VAZGEÇ</button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 w-full animate-fadeIn">
                  <span className="text-xs font-bold text-purple-400 uppercase italic">Yeni Birim/Departman:</span>
                  <input 
                    type="text"
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 flex-1"
                    placeholder="Örn: DevOps Team"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                  />
                  <button onClick={handleBulkUpdateDepartment} disabled={!bulkValue} className="bg-purple-600 px-6 py-2 rounded-xl text-xs font-black uppercase disabled:opacity-50">GÜNCELLE</button>
                  <button onClick={() => setBulkMode('none')} className="text-xs font-bold text-white/50 hover:text-white">VAZGEÇ</button>
                </div>
              )}
            </div>

            <button 
              onClick={() => { setSelectedIds(new Set()); setBulkMode('none'); }}
              className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/30 hover:text-white"
              title="Seçimi Temizle"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-[98%] mx-auto mt-8 px-4">
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
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center">
                <div className="relative flex-1 w-full">
                  <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Ad, IP, Birim veya vCenter ile ara..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FFD200] focus:border-[#FFD200] outline-none text-sm bg-slate-50 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex space-x-2 w-full md:w-auto">
                  <select className="flex-1 md:flex-none px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#FFD200]" value={filterOS} onChange={(e) => setFilterOS(e.target.value)}>
                    <option value="All">Tüm OS</option>
                    <option value="Linux">Linux</option>
                    <option value="Windows">Windows</option>
                  </select>
                  <select className="flex-1 md:flex-none px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#FFD200]" value={filterBackup} onChange={(e) => setFilterBackup(e.target.value)}>
                    <option value="All">Yedek Durumu</option>
                    <option value="Yes">Yedekli</option>
                    <option value="No">Yedeksiz</option>
                  </select>
                </div>
              </div>

              {(dashboardFilter || searchTerm || filterOS !== 'All' || filterBackup !== 'All') && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Aktif Filtreler:</span>
                  {dashboardFilter && (
                    <div className="bg-[#1C1C1E] text-[#FFD200] px-3 py-1 rounded-full text-[10px] font-black flex items-center shadow-lg transform hover:scale-105 transition-transform">
                      <span className="mr-2 uppercase">{dashboardFilter.label}</span>
                      <button onClick={() => setDashboardFilter(null)} className="hover:text-white ml-2">&times;</button>
                    </div>
                  )}
                  {searchTerm && (
                    <div className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black flex items-center">
                      <span className="mr-2 uppercase">Arama: {searchTerm}</span>
                      <button onClick={() => setSearchTerm('')} className="hover:text-black ml-2">&times;</button>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setDashboardFilter(null);
                      setSearchTerm('');
                      setFilterOS('All');
                      setFilterBackup('All');
                    }}
                    className="text-[10px] font-black text-[#1C1C1E] hover:underline uppercase italic ml-2"
                  >
                    Tümünü Temizle
                  </button>
                </div>
              )}
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="bg-[#1C1C1E] border-b border-white/5">
                        <th className="px-3 py-4 w-10">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-[#FFD200] rounded cursor-pointer" 
                            checked={filteredServers.length > 0 && selectedIds.size === filteredServers.length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-3 py-4 text-[11px] font-bold text-[#FFD200] uppercase tracking-wider whitespace-nowrap">Sunucu Adı</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">IP Adresi</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">OS</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Versiyon</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">CPU</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">RAM</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">Disk</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">Altyapı</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">vCenter</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Birim / Sahibi</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Son Yama</th>
                        <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Yedek</th>
                        {isAdmin && <th className="px-3 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">İşlemler</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredServers.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="px-6 py-12 text-center text-slate-400 italic text-sm">Aranan kriterlerde sunucu bulunamadı.</td>
                        </tr>
                      ) : (
                        filteredServers.map((server) => (
                          <tr 
                            key={server.id} 
                            className={`transition-colors group ${selectedIds.has(server.id) ? 'bg-[#FFD200]/10' : 'hover:bg-[#FFD200]/5'}`}
                          >
                            <td className="px-3 py-4">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-[#FFD200] rounded cursor-pointer" 
                                checked={selectedIds.has(server.id)}
                                onChange={() => toggleSelect(server.id)}
                              />
                            </td>
                            <td className="px-3 py-4 text-sm font-bold text-slate-800 whitespace-nowrap" onClick={() => toggleSelect(server.id)}>{server.name}</td>
                            <td className="px-3 py-4 text-[11px] font-mono text-slate-600 whitespace-nowrap">{server.ipAddress}</td>
                            <td className="px-3 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${server.os === 'Linux' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                {server.os}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-[11px] text-slate-500 whitespace-nowrap">
                              <span className={isEOL(server.os, server.osVersion) ? 'text-red-600 font-bold flex items-center' : ''}>
                                {server.osVersion}
                                {isEOL(server.os, server.osVersion) && (
                                  <svg className="w-3 h-3 ml-1 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                )}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-600">{server.cpu}</span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-600">{server.memory}</span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className="bg-[#1C1C1E] text-[#FFD200] px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap">{server.disk}</span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                  server.infraType === 'Virtual' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                                }`}>
                                {server.infraType === 'Virtual' ? 'Sanal' : 'Fiziksel'}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-[10px] font-semibold text-slate-600">
                              {server.vCenterName}
                            </td>
                            <td className="px-3 py-4">
                              <div className={`text-xs font-semibold truncate max-w-[120px] ${!server.department ? 'text-red-500 italic' : 'text-slate-700'}`} title={server.department}>{server.department || 'Birim Yok'}</div>
                              <div className={`text-[10px] italic truncate max-w-[120px] ${!server.owner ? 'text-red-400' : 'text-slate-400'}`} title={server.owner}>{server.owner || 'Sahip Yok'}</div>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded ${needsPatching(server) ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                {server.lastPatchedDate || 'Hiç yama almadı'}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                  server.isBackedUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {server.isBackedUp ? 'Aktif' : 'Eksik'}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="px-3 py-4 text-right whitespace-nowrap">
                                <div className="flex justify-end space-x-1">
                                  <button 
                                    onClick={() => { setEditingServer(server); setIsFormOpen(true); }} 
                                    className="text-slate-400 hover:text-black hover:bg-[#FFD200] p-2 rounded-lg transition-all"
                                    title="Düzenle"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteServer(server.id)} 
                                    className="text-slate-400 hover:text-white hover:bg-red-600 p-2 rounded-lg transition-all"
                                    title="Sil"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'users' ? (
          <UserManagement users={managedUsers} onUpdateUser={(id, data) => setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))} onDeleteUser={(id) => setManagedUsers(prev => prev.filter(u => u.id !== id))} onAddUser={(data) => setManagedUsers(prev => [...prev, { ...data as any, id: Date.now().toString(), lastLogin: '' }])} currentUser={user!} />
        ) : (
          <VCenterManagement vCenters={vCenters} onAdd={handleAddVCenter} onUpdate={handleUpdateVCenter} onDelete={handleDeleteVCenter} />
        )}
      </main>

      {isAdmin && (
        <>
          <ServerForm 
            isOpen={isFormOpen} 
            onClose={() => { setIsFormOpen(false); setEditingServer(null); }} 
            onSubmit={(data) => {
              if (editingServer) setServers(prev => prev.map(s => s.id === editingServer.id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
              else setServers(prev => [...prev, { ...data as Server, id: Date.now().toString(), updatedAt: new Date().toISOString() }]);
              setIsFormOpen(false); setEditingServer(null);
            }} 
            onDelete={handleDeleteServer}
            initialData={editingServer} 
            vCenters={vCenters} 
          />
          <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={handleImportServers} />
        </>
      )}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user!} onUpdate={(data) => setUser(prev => prev ? { ...prev, ...data } : null)} />
    </div>
  );
};

export default App;
