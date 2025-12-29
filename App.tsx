
import React, { useState, useEffect, useMemo } from 'react';
import { Server, InventoryStats, ManagedUser, VCenter } from './types';
import Dashboard from './components/Dashboard';
import ServerForm from './components/ServerForm';
import ImportModal from './components/ImportModal';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import VCenterManagement from './components/VCenterManagement';
import ProfileModal from './components/ProfileModal';

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
  const [dashboardFilter, setDashboardFilter] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user) localStorage.setItem('inventory_user', JSON.stringify(user));
    localStorage.setItem('inventory_managed_users', JSON.stringify(managedUsers));
    localStorage.setItem('inventory_servers', JSON.stringify(servers));
    localStorage.setItem('inventory_vcenters', JSON.stringify(vCenters));
  }, [servers, user, managedUsers, vCenters]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterOS('All');
    setDashboardFilter(null);
  };

  const filteredServers = useMemo(() => {
    return servers.filter(s => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(lowerSearch) || 
                           s.ipAddress.includes(searchTerm) ||
                           s.owner.toLowerCase().includes(lowerSearch) ||
                           s.department.toLowerCase().includes(lowerSearch);
      const matchesOS = filterOS === 'All' || s.os === filterOS;
      
      if (dashboardFilter) {
          if (dashboardFilter.key === 'unbacked' && s.isBackedUp) return false;
          if (dashboardFilter.key === 'os' && s.os !== dashboardFilter.value) return false;
      }

      return matchesSearch && matchesOS;
    });
  }, [servers, searchTerm, filterOS, dashboardFilter]);

  const stats: InventoryStats = useMemo(() => {
    const total = servers.length;
    let totalCpu = 0;
    let totalRamGb = 0;
    servers.forEach(s => {
      totalCpu += parseInt(s.cpu) || 0;
      const ramVal = parseFloat(s.memory) || 0;
      totalRamGb += s.memory.toLowerCase().includes('mb') ? ramVal / 1024 : ramVal;
    });

    return {
      totalServers: total,
      linuxCount: servers.filter(s => s.os === 'Linux').length,
      windowsCount: servers.filter(s => s.os === 'Windows').length,
      backupRate: total > 0 ? (servers.filter(s => s.isBackedUp).length / total) * 100 : 0,
      totalCpu,
      totalRamGb,
      vCenterDistribution: {},
      locationDistribution: {},
      infraDistribution: {},
      osVersionDistribution: {}
    };
  }, [servers]);

  if (!user) return <Login users={managedUsers} onLogin={setUser} />;

  return (
    <div className="min-h-screen pb-40 bg-slate-50 relative">
      <nav className="bg-[#1C1C1E] border-b border-white/10 sticky top-0 z-40 shadow-xl">
        <div className="max-w-[100%] mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="bg-[#FFD200] p-1.5 rounded-lg text-black font-black text-xl italic px-3 transform -skew-x-12 cursor-pointer" onClick={() => setActiveTab('inventory')}>NESİNE</div>
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
                  <button onClick={() => setIsImportOpen(true)} className="px-3 py-1.5 text-slate-300 hover:text-[#FFD200] text-sm font-medium">Dışarıdan Aktar</button>
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
            <Dashboard stats={stats} servers={servers} onFilterChange={setDashboardFilter} />
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
                <input type="text" placeholder="Sunucu adı, IP, Birim veya Sahibi ile ara..." className="flex-1 w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-[#FFD200] font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <div className="flex gap-2">
                  <select className="px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold" value={filterOS} onChange={(e) => setFilterOS(e.target.value)}>
                    <option value="All">Tüm OS</option>
                    <option value="Linux">Linux</option>
                    <option value="Windows">Windows</option>
                  </select>
                  <button onClick={clearAllFilters} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase">Sıfırla</button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1600px]">
                  <thead>
                    <tr className="bg-[#1C1C1E] text-[#FFD200] uppercase italic">
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">Sunucu Adı</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">IP Adresi</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">OS</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">OS Versiyon</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">CPU</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">RAM</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">Disk</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">VCenter Ismi</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">Kurulum Tarihi</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">Birim</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest">Sahibi</th>
                      <th className="px-4 py-4 text-[10px] font-black tracking-widest text-center">Yedek</th>
                      {isAdmin && <th className="px-4 py-4 text-right">İşlem</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {filteredServers.map(server => (
                      <tr key={server.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-black uppercase">{server.name}</td>
                        <td className="px-4 py-4 font-mono text-xs">{server.ipAddress}</td>
                        <td className="px-4 py-4">
                           <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${server.os === 'Linux' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{server.os}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">{server.osVersion}</td>
                        <td className="px-4 py-4 text-xs">{server.cpu} Core</td>
                        <td className="px-4 py-4 text-xs">{server.memory}</td>
                        <td className="px-4 py-4 text-xs text-slate-400">{server.disk}</td>
                        <td className="px-4 py-4 text-xs text-slate-400">{server.vCenterName}</td>
                        <td className="px-4 py-4 text-xs">{server.installationDate}</td>
                        <td className="px-4 py-4 text-xs">{server.department}</td>
                        <td className="px-4 py-4 text-xs italic">{server.owner}</td>
                        <td className="px-4 py-4 text-center">
                           <span className={`px-2 py-1 rounded-full text-[9px] uppercase ${server.isBackedUp ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{server.isBackedUp ? 'AKTİF' : 'YOK'}</span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-4 text-right">
                            <button onClick={() => { setEditingServer(server); setIsFormOpen(true); }} className="px-3 py-1 bg-slate-100 hover:bg-[#FFD200] rounded text-[10px] uppercase">Düzenle</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'users' ? (
          <UserManagement users={managedUsers} onUpdateUser={(id, data) => setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))} onDeleteUser={(id) => setManagedUsers(prev => prev.filter(u => u.id !== id))} onAddUser={(data) => setManagedUsers(prev => [...prev, { ...data as any, id: Date.now().toString(), lastLogin: '' }])} currentUser={user!} />
        ) : (
          <VCenterManagement vCenters={vCenters} onAdd={(name, loc) => setVCenters(prev => [...prev, { id: Date.now().toString(), name, location: loc }])} onUpdate={(id, name, loc) => setVCenters(prev => prev.map(vc => vc.id === id ? { ...vc, name, location: loc } : vc))} onDelete={(id) => setVCenters(prev => prev.filter(vc => vc.id !== id))} />
        )}
      </main>

      {isAdmin && (
        <>
          <ServerForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingServer(null); }} onSubmit={(data) => {
            if (editingServer) setServers(prev => prev.map(s => s.id === editingServer.id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
            else setServers(prev => [...prev, { ...data as Server, id: Date.now().toString(), updatedAt: new Date().toISOString() }]);
            setIsFormOpen(false);
          }} onDelete={(id) => setServers(prev => prev.filter(s => s.id !== id))} initialData={editingServer} vCenters={vCenters} />
          <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={(s) => setServers(prev => [...prev, ...s])} />
        </>
      )}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user!} onUpdate={setUser} />
    </div>
  );
};

export default App;
