
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
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processExcelData = (data: any[]) => {
    if (data.length === 0) throw new Error('Yüklediğiniz Excel dosyası boş görünüyor.');

    const firstRowKeys = Object.keys(data[0]);
    const missingHeaders = ["Sunucu Adı", "IP Adresi"].filter(h => !firstRowKeys.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Excel dosyasında şu sütunlar bulunamadı: ${missingHeaders.join(", ")}. Lütfen şablonu kullanın.`);
    }

    const validServers: Server[] = [];

    data.forEach((row: any) => {
      const ipAddress = (row["IP Adresi"] || '').toString().trim();
      
      // IPv6 FİLTRELEME: IP adresinde ':' varsa bu sunucuyu tamamen atla
      if (ipAddress.includes(':')) {
        console.warn(`IPv6 adresi atlandı: ${ipAddress}`);
        return;
      }

      // IPv4 format kontrolü (opsiyonel ama daha güvenli)
      const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (ipAddress && !ipv4Regex.test(ipAddress)) {
        console.warn(`Geçersiz IP formatı atlandı: ${ipAddress}`);
        return;
      }

      const osVal = (row["OS"] || 'Linux').toString();
      const backupVal = (row["Yedek Durumu"] || '').toString().toLowerCase();
      
      validServers.push({
        id: Math.random().toString(36).substr(2, 9),
        name: (row["Sunucu Adı"] || 'Bilinmiyor').toString(),
        ipAddress: ipAddress || '0.0.0.0',
        os: osVal.toLowerCase().includes('win') ? 'Windows' : 'Linux',
        osVersion: (row["OS Versiyonu"] || '').toString(),
        cpu: (row["CPU"] || '1').toString(),
        memory: (row["RAM"] || '4 GB').toString(),
        disk: '50 GB',
        infraType: 'Virtual',
        vCenterName: (row["vCenter İsmi"] || 'vCenter-Default').toString(),
        installationDate: (row["Kurulum Tarihi"] || new Date().toISOString().split('T')[0]).toString(),
        lastPatchedDate: (row["Yama Tarihi"] || '').toString(),
        department: (row["Birim"] || '').toString(),
        owner: (row["Sahibi"] || '').toString(),
        techTeam: (row["Teknik Ekip"] || '').toString(),
        isBackedUp: ['evet', 'yes', 'aktif', 'true'].includes(backupVal),
        updatedAt: new Date().toISOString()
      } as Server);
    });

    return validServers;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (event) => {
        try {
          const bstr = event.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          const servers = processExcelData(data);
          onImport(servers);
          setError('');
          onClose();
        } catch (err: any) {
          setError('Hata: ' + err.message);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportText(content);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSmartImport = () => {
    if (!importText.trim()) return;
    setIsProcessing(true);
    setError('');
    
    try {
      const servers = parseTextLocally(importText);
      if (servers.length === 0) {
        throw new Error("Geçerli IPv4 sunucu bilgisi bulunamadı (IPv6 adresleri filtrelenmiş olabilir).");
      }
      onImport(servers);
      setImportText('');
      onClose();
    } catch (e: any) {
      setError(e.message || 'Metin çözümlenirken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadXLSXTemplate = () => {
    const templateData = [
      {
        "Sunucu Adı": "SRV-PROD-APP01",
        "IP Adresi": "10.20.10.50",
        "OS": "Linux",
        "OS Versiyonu": "Ubuntu 22.04",
        "vCenter İsmi": "VC-ISTANBUL-01",
        "CPU": "4",
        "RAM": "16 GB",
        "Kurulum Tarihi": "2023-05-12",
        "Yama Tarihi": "",
        "Birim": "Core Banking",
        "Sahibi": "Ahmet Yılmaz",
        "Teknik Ekip": "DevOps Team",
        "Yedek Durumu": "Evet"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory_Template");
    XLSX.writeFile(wb, "Nesine_Envanter_Sablonu.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 italic uppercase tracking-tighter">Sabit Formatlı Veri Aktarımı</h2>
            <p className="text-xs text-slate-500 mt-1">Sadece IPv4 adresleri desteklenmektedir. IPv6 sunucular otomatik elenir.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl">&times;</button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-[#FFD200] transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-slate-400 group-hover:text-[#FFD200] transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h4 className="font-bold text-slate-700 mb-1">Excel Dosyası (.xlsx)</h4>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Sadece IPv4 Kabul Edilir</p>
              <div className="flex space-x-2">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[#1C1C1E] text-[#FFD200] rounded-xl hover:bg-black transition-all text-xs font-black uppercase">Yükle</button>
                <button onClick={downloadXLSXTemplate} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-xs font-black uppercase">Şablonu İndir</button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
            </div>

            <div className="bg-blue-50/30 p-6 rounded-2xl border-2 border-dashed border-blue-100 flex flex-col items-center justify-center text-center group hover:border-blue-400 transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-blue-400 group-hover:scale-110 transition-transform">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h4 className="font-bold text-blue-800 mb-1">AI Metin Analizi</h4>
              <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-4">Metin kopyalayıp yapıştırın</p>
              <button onClick={() => document.getElementById('text-area-import')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-xs font-black uppercase shadow-lg shadow-blue-200">Metin Girişi</button>
            </div>
          </div>

          <div id="text-area-import" className="relative scroll-mt-6">
            <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Metin / Log Girişi</div>
            <textarea
              className="w-full h-40 px-4 py-4 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#FFD200]/10 focus:border-[#FFD200] outline-none font-mono text-xs bg-slate-50 transition-all"
              placeholder={`Buraya vCenter'dan kopyaladığınız düz metni yapıştırın...\nIPv6 adresi içeren satırlar otomatik olarak filtrelenecektir.`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border-2 border-red-100 font-bold animate-shake flex items-center space-x-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>IPv6 Engelli</span>
               </div>
               <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Disk: 50GB Sabit</span>
               </div>
            </div>
            
            <button
              onClick={handleSmartImport}
              disabled={!importText.trim() || isProcessing}
              className="w-full md:w-auto px-8 py-3 bg-[#FFD200] text-black rounded-xl hover:bg-[#ffdf40] shadow-lg shadow-[#FFD200]/20 font-black text-sm flex items-center justify-center space-x-2 disabled:opacity-50 transition-all active:scale-95"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              <span>METNİ ANALİZ ET</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
