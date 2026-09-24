export type UserRole = 'superadmin' | 'pegawai';

export interface AppUser {
  id: string;
  username: string; // unique username e.g. "admin", "budi", "eko.mski"
  displayName: string; // e.g. "Admin Super KPPN 026", "Budi Santoso, S.E."
  role: UserRole; // 'superadmin' | 'pegawai'
  jabatan?: string; // e.g. "Kepala Seksi MSKI", "Pelaksana Seksi MSKI", "PTP KPPN"
  seksi?: string; // e.g. "Seksi MSKI", "Seksi Bank", "Seksi Pera", "Seksi Vera", "Subbagian Umum"
  nip?: string;
  email?: string;
  noHp?: string;
  photoUrl?: string; // Can be Google Drive sharing link, direct URL, or web link
  customGreeting?: string; // e.g. "Hai Budi! Semangat melayani Satker hari ini", "Hai Admin!"
  passwordRaw?: string; // Stored user password for login
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserSession {
  user: AppUser;
  token: string;
  loginTime: number;
}
