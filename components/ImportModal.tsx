
import React, { useState, useRef } from 'react';
import { Server } from '../types';
import { parseTextLocally } from '../services/localParser';
import * as XLSX from 'xlsx';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (servers: Server[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processExcelData = (data: any[]) => {
    if (data.length === 0) throw new Error('Excel dosyası boş görünüyor.');

    const firstRowKeys = Object.keys(data[0]);
    const missingHeaders = ["Sunucu Adı", "IP Adresi"].filter(h => !firstRowKeys.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Eksik sütunlar: ${missingHeaders.join(", ")}`);
    }

    return data.filter(row => {
      const ip = (row["IP Adresi"] || '').toString();
      return !ip.includes(':'); // IPv6 filtreleme
    }).map((row: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: (row["Sunucu Adı"] || 'Bilinmiyor').toString(),
      ipAddress: (row["IP Adresi"] || '0.0.0.0').toString(),
      os: (row["OS"] || '').toString().toLowerCase().includes('win') ? 'Windows' : 'Linux',
      osVersion: (row["OS Versiyonu"] || '').toString(),
      cpu: (row["CPU"] || '1').toString(),
      memory: (row["RAM"] || '4 GB').toString(),
      disk: '50 GB',
      vCenterName: (row["vCenter İsmi"] || 'Default-vCenter').toString(),
      installationDate: new Date().toISOString().split('T')[0],
      department: (row["Birim"] || '').toString(),
      owner: (row["Sahibi"] || '').toString(),
      isBackedUp: ['evet', 'yes', 'true'].includes((row["Yedek Durumu"] || '').toString().toLowerCase()),
      updatedAt: new Date().toISOString()
    } as Server));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const servers = processExcelData(data);
        onImport(servers);
        onClose();
      } catch (err: any) {
        setError('Excel Hatası: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleManualImport = () => {
    try {
      const servers = parseTextLocally(importText);
      if (servers.length === 0) throw new Error("Geçerli veri bulunamadı.");
      onImport(servers);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const downloadTemplate = () => {
    const data = [{ "Sunucu Adı": "SRV01", "IP Adresi": "10.0.0.1", "OS": "Linux", "OS Versiyonu": "Ubuntu 22.04", "CPU": "2", "RAM": "4 GB", "Yedek Durumu": "Evet" }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sablon");
    XLSX.writeFile(wb, "Sunucu_Sablonu.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-black italic uppercase tracking-tighter">Sunucu Aktarımı</h2>
          <button onClick={onClose} className="text-slate-400 text-3xl">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-[#FFD200] transition-all flex flex-col items-center">
            <span className="font-bold text-slate-700">Excel Yükle</span>
            <span className="text-[10px] text-slate-400 uppercase mt-1">.xlsx dosyası seçin</span>
          </button>
          <button onClick={downloadTemplate} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:bg-slate-100 transition-all flex flex-col items-center">
            <span className="font-bold text-slate-700">Şablonu İndir</span>
            <span className="text-[10px] text-slate-400 uppercase mt-1">Örnek Excel Dosyası</span>
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx" className="hidden" />

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metin Olarak Yapıştır</label>
          <textarea 
            className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-mono outline-none focus:border-[#FFD200]" 
            placeholder="vCenter loglarını veya düz metni buraya yapıştırın..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

        <button onClick={handleManualImport} className="w-full py-4 bg-black text-[#FFD200] rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
          Aktarımı Başlat
        </button>
      </div>
    </div>
  );
};

export default ImportModal;
