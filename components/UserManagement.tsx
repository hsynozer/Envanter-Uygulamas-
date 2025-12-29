
import React, { useState } from 'react';
import { ManagedUser, UserRole } from '../types';

interface UserManagementProps {
  users: ManagedUser[];
  onUpdateUser: (userId: string, updatedData: Partial<ManagedUser>) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: (user: Partial<ManagedUser>) => void;
  currentUser: ManagedUser;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUser, onDeleteUser, onAddUser, currentUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'member' as UserRole,
    department: ''
  });

  const resetForm = () => {
    setFormData({ username: '', fullName: '', password: '', role: 'member', department: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (user: ManagedUser) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      password: '', // Şifreyi güvenlik için boş gösteriyoruz, sadece dolarsa güncellenir
      role: user.role,
      department: user.department
    });
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updatePayload: any = { ...formData };
      if (!formData.password) delete updatePayload.password; // Şifre boşsa güncelleme
      onUpdateUser(editingId, updatePayload);
    } else {
      onAddUser(formData);
    }
    resetForm();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kullanıcı Yönetimi</h2>
          <p className="text-sm text-slate-500">Sistem erişimi olan yerel kullanıcıları yönetin.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Kullanıcı Oluştur</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-50 border border-blue-100 rounded-xl p-6 shadow-inner relative">
          <button onClick={resetForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">&times;</button>
          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4">
            {editingId ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Tanımla'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Kullanıcı Adı</label>
              <input 
                required
                disabled={!!editingId}
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100" 
                placeholder="Username"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tam İsim</label>
              <input 
                required
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Ad Soyad"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                {editingId ? 'Şifre (Değişmeyecekse Boş)' : 'Şifre'}
              </label>
              <input 
                required={!editingId}
                type="password"
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Departman</label>
              <input 
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="IT / DevOps"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Rol</label>
              <select 
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
              {editingId ? 'Güncelle' : 'Ekle'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kullanıcı</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Departman</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Son Giriş</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rol</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">{user.fullName}</div>
                    <div className="text-xs text-slate-500 font-mono">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.department || 'Belirtilmemiş'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString('tr-TR') : 'Hiç giriş yapmadı'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Düzenle"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      {user.username !== currentUser.username && (
                        <button 
                          onClick={() => onDeleteUser(user.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
