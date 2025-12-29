
import { Server, OSFamily, InfrastructureType } from "../types";

export function parseTextLocally(text: string): Server[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const servers: Server[] = [];

  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
  const ipv6Heuristic = /:/; // IPv6 adresleri mutlaka ':' içerir
  const ramRegex = /(\d+)\s*(gb|mb|ram|memory)/i;
  
  const osKeywords = {
    Linux: ['linux', 'ubuntu', 'centos', 'debian', 'redhat', 'rhel', 'suse', 'oracle', 'unix', 'kali', 'fedora'],
    Windows: ['windows', 'win', 'server 20', '2019', '2016', '2022', 'ws']
  };

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    // IPv6 KONTROLÜ: Satırda IPv6 adresi varsa bu satırı tamamen atla
    if (ipv6Heuristic.test(line)) {
      console.log("IPv6 adresi tespit edildi, satır atlanıyor:", line);
      return;
    }

    const parts = line.split(/[\s,;\t]+/).map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length === 0) return;

    // 1. IP Tespiti (Sadece IPv4)
    const ipMatch = line.match(ipRegex);
    if (!ipMatch) return; // Geçerli bir IPv4 bulunamadıysa atla
    const ip = ipMatch[0];

    // 2. RAM Tespiti
    const ramMatch = line.match(ramRegex);
    const memory = ramMatch ? `${ramMatch[1]} ${ramMatch[2].toUpperCase()}` : '4 GB';

    // 3. CPU Tespiti
    let cpu = '1';
    const ipParts = ip.split('.');
    
    for (const part of parts) {
      const num = parseInt(part);
      if (!isNaN(num) && /^\d+$/.test(part)) {
        const isIpPart = ipParts.includes(part);
        const isRamValue = ramMatch && ramMatch[1] === part;
        
        if (!isIpPart && !isRamValue && num > 0 && num <= 256) {
          cpu = part;
          break;
        }
      }
    }

    // 4. Disk (Sabit 50 GB)
    const disk = '50 GB';

    // 5. İsim Tespiti
    let name = parts.find(p => 
      !ipRegex.test(p) && 
      p.length > 2 && 
      !/^\d+$/.test(p) && 
      !osKeywords.Linux.some(k => p.toLowerCase().includes(k)) && 
      !osKeywords.Windows.some(k => p.toLowerCase().includes(k)) &&
      !p.toLowerCase().includes('gb') &&
      !p.toLowerCase().includes('mb')
    ) || 'Bilinmiyor';

    // 6. OS ve Versiyon
    let os: OSFamily = 'Other';
    let osVersion = '';
    
    if (osKeywords.Windows.some(k => lowerLine.includes(k))) {
      os = 'Windows';
      const winVerMatch = line.match(/(2008|2012|2016|2019|2022|10|11)/);
      if (winVerMatch) osVersion = `Server ${winVerMatch[0]}`;
    } else if (osKeywords.Linux.some(k => lowerLine.includes(k))) {
      os = 'Linux';
      const linuxVerMatch = line.match(/(22\.04|20\.04|18\.04|7\.\d|8\.\d|9\.\d)/);
      const distroMatch = line.match(/(ubuntu|centos|debian|redhat|rhel|suse)/i);
      osVersion = `${distroMatch ? distroMatch[0] : ''} ${linuxVerMatch ? linuxVerMatch[0] : ''}`.trim();
    }

    // 7. Yama Tarihi
    const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b/;
    const dateMatch = line.match(dateRegex);
    const lastPatchedDate = dateMatch ? dateMatch[1] : '';

    const infraType: InfrastructureType = lowerLine.includes('physical') || lowerLine.includes('fiziksel') || lowerLine.includes('baremetal') ? 'Physical' : 'Virtual';

    servers.push({
      id: Math.random().toString(36).substr(2, 9),
      name, ipAddress: ip, os, osVersion,
      cpu, memory, disk, infraType,
      vCenterName: 'Default-vCenter',
      installationDate: new Date().toISOString().split('T')[0],
      lastPatchedDate: lastPatchedDate,
      department: '', owner: '', techTeam: '',
      isBackedUp: lowerLine.includes('yedek') || lowerLine.includes('backup') || lowerLine.includes('evet'),
      updatedAt: new Date().toISOString()
    });
  });

  return servers;
}
