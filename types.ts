
export type OSFamily = 'Linux' | 'Windows' | 'Other';
export type UserRole = 'admin' | 'member';
export type InfrastructureType = 'Virtual' | 'Physical';

export interface VCenter {
  id: string;
  name: string;
  location?: string;
  description?: string;
}

export interface User {
  username: string;
  fullName: string;
  role: UserRole;
  department: string;
}

export interface ManagedUser extends User {
  id: string;
  lastLogin: string;
  password?: string;
}

export interface Server {
  id: string;
  name: string;
  ipAddress: string;
  os: OSFamily;
  osVersion: string;
  cpu: string;
  memory: string;
  disk: string;
  infraType: InfrastructureType;
  vCenterName: string;
  installationDate: string;
  lastPatchedDate: string; // Dinamik yama takibi için eklendi
  department: string;
  owner: string;
  techTeam: string;
  isBackedUp: boolean;
  notes?: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalServers: number;
  linuxCount: number;
  windowsCount: number;
  backupRate: number;
  totalCpu: number;
  totalRamGb: number;
  vCenterDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
  infraDistribution: Record<string, number>;
  osVersionDistribution: Record<string, number>;
}
