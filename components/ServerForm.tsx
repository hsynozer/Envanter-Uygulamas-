
import React, { useState, useEffect } from 'react';
import { Server, OSFamily, InfrastructureType, VCenter } from '../types';

interface ServerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (server: Partial<Server>) => void;
  onDelete?: (id: string) => void;
  initialData?: Server | null;
  vCenters: VCenter[];
}

const ServerForm: React.FC<ServerFormProps> = ({ isOpen, onClose, onSubmit, onDelete, initialData, vCenters }) => {
  const [formData, setFormData] = useState<Partial<Server>>({
    name: '', ipAddress: '', os: 'Linux', osVersion: '',
    cpu: '1', memory: '4 GB', disk: '50 GB', infraType: 'Virtual',
    vCenterName: '', installationDate: new Date().toISOString().split('T')[0],
    lastPatchedDate: '', // Boş başlasın
    department: '', owner: '', techTeam: '', isBackedUp: false, notes: ''
  });

  const cpuOptions = ['1', '2', '4', '8', '12', '16', '24', '32', '48', '64', '128'];
  const ramOptions = ['2 GB', '4 GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB'];

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({
      name: '', ipAddress: '', os: 'Linux', osVersion: '',
      cpu: '1', memory: '4 GB', disk: '50 GB', infraType: 'Virtual',
      vCenterName: vCenters.length > 0 ? vCenters[0].name : '',
      installationDate: new Date().toISOString().split('T')[0],
      lastPatchedDate: '', // Boş başlasın
      department: '', owner: '', techTeam: '', isBackedUp: false, notes: ''
    });
  }, [initialData, isOpen, vCenters]);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (initialData && initialData.id && onDelete) {
      if (window.confirm(`"${initialData.name}" sunucusunu kalıcı olarak silmek istediğinize emin misiniz?`)) {
        onDelete(initialData.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight italic">{initialData ? 'Sunucu Düzenle' : 'Yeni Sunucu Ekle'}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Nesine Envanter Yönetimi</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-black text-3xl transition-colors">&times;</button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sunucu Adı</label>
              <input required className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#FFD200]/20 focus:border-[#FFD200] font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">IP Adresi</label>
              <input required className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#FFD200]/20 focus:border-[#FFD200] font-mono font-bold" value={formData.ipAddress} onChange={e => setFormData({...formData, ipAddress: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">İşletim Sistemi</label>
              <select className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#FFD200]/20 focus:border-[#FFD200] bg-white font-bold" value={formData.os} onChange={e => setFormData({...formData, os: e.target.value as OSFamily})}>
                <option value="Linux">Linux</option>
                <option value="Windows">Windows</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">OS Versiyon</label>
              <input className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#FFD200]/20 focus:border-[#FFD200] font-bold" placeholder="Örn: Ubuntu 22.04" value={formData.osVersion} onChange={e => setFormData({...formData, osVersion: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Son Yama Tarihi (Patching)</label>
              <input type="date" className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#FFD200]/20 focus:border-[#FFD200] font-bold" value={formData.lastPatchedDate} onChange={e => setFormData({...formData, lastPatchedDate: e.target.value})} />
            </div>

            <div className="p-6 bg-[#1C1C1E] rounded-3xl md:col-span-3 grid grid-cols-3 gap-6 shadow-xl">
              <div>
                <label className="block text-[10px] font-black text-[#FFD200] uppercase tracking-widest mb-2">CPU</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-[#FFD200]" value={formData.cpu} onChange={e => setFormData({...formData, cpu: e.target.value})}>
                  {cpuOptions.map(opt => <option className="text-black" key={opt} value={opt}>{opt} Core</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#FFD200] uppercase tracking-widest mb-2">RAM</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-[#FFD200]" value={formData.memory} onChange={e => setFormData({...formData, memory: e.target.value})}>
                  {ramOptions.map(opt => <option className="text-black" key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#FFD200] uppercase tracking-widest mb-2">DISK</label>
                <input readOnly className="w-full px-4 py-2 bg-white/5 border border-white/5 text-white/50 rounded-xl outline-none cursor-not-allowed" value="50 GB" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">vCenter</label>
              <select required className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#FFD200]/20 focus:border-[#FFD200] bg-white font-bold" value={formData.vCenterName} onChange={e => setFormData({...formData, vCenterName: e.target.value})}>
                <option value="">Seçiniz...</option>
                {vCenters.map(vc => <option key={vc.id} value={vc.name}>{vc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sorumlu Birim</label>
              <input className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#FFD200]/20 focus:border-[#FFD200] font-bold" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" id="bkp" className="w-6 h-6 accent-[#FFD200] mr-3 rounded-lg" checked={formData.isBackedUp} onChange={e => setFormData({...formData, isBackedUp: e.target.checked})} />
              <label htmlFor="bkp" className="text-sm font-black text-black uppercase tracking-tight cursor-pointer">Yedekleme Aktif</label>
            </div>
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-slate-100">
            <div>
              {initialData && (
                <button type="button" onClick={handleDelete} className="px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span>Sunucuyu Sil</span>
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <button type="button" onClick={onClose} className="px-8 py-3 border-2 border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 font-black uppercase tracking-widest text-xs transition-all">İptal</button>
              <button type="submit" className="px-10 py-3 bg-[#1C1C1E] text-[#FFD200] rounded-2xl hover:bg-black font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95">Kaydet</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServerForm;
