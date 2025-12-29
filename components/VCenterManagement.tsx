
import React, { useState } from 'react';
import { VCenter } from '../types';

interface VCenterManagementProps {
  vCenters: VCenter[];
  onAdd: (name: string, location: string) => void;
  onUpdate: (id: string, name: string, location: string) => void;
  onDelete: (id: string) => void;
}

const VCenterManagement: React.FC<VCenterManagementProps> = ({ vCenters, onAdd, onUpdate, onDelete }) => {
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  
  // Düzenleme durumu
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd(newName.trim(), newLocation.trim());
      setNewName('');
      setNewLocation('');
    }
  };

  const startEditing = (vc: VCenter) => {
    setEditingId(vc.id);
    setEditName(vc.name);
    setEditLocation(vc.location || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditLocation('');
  };

  const handleUpdateSubmit = (id: string) => {
    if (editName.trim()) {
      onUpdate(id, editName.trim(), editLocation.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">vCenter Yönetimi</h2>
          <p className="text-sm text-slate-500">Envanterde seçilebilecek vCenter sunucularını tanımlayın.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">vCenter Sunucu Adı</label>
            <input 
              required
              className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Örn: VC-ISTANBUL-01"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Lokasyon / Veri Merkezi</label>
            <input 
              className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Örn: Istanbul - Pendik"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
            />
          </div>
          <button type="submit" className="self-end bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 h-10">
            vCenter Ekle
          </button>
        </form>

        <div className="overflow-hidden border border-slate-50 rounded-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">vCenter Adı</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Lokasyon</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vCenters.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic text-sm">Henüz vCenter tanımlanmamış.</td>
                </tr>
              ) : (
                vCenters.map((vc) => (
                  <tr key={vc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {editingId === vc.id ? (
                        <input 
                          autoFocus
                          className="px-3 py-1 border rounded w-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      ) : (
                        <span className="font-semibold text-slate-700">{vc.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === vc.id ? (
                        <input 
                          className="px-3 py-1 border rounded w-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          value={editLocation}
                          onChange={e => setEditLocation(e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-slate-600">{vc.location || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === vc.id ? (
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleUpdateSubmit(vc.id)}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Kaydet"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                          </button>
                          <button 
                            onClick={cancelEditing}
                            className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors"
                            title="İptal"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => startEditing(vc)}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Düzenle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button 
                            onClick={() => { if(window.confirm(`${vc.name} silindiğinde mevcut sunucuların vCenter bilgisi boş kalabilir. Emin misiniz?`)) onDelete(vc.id); }}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            title="Sil"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VCenterManagement;
