import { AppUser, UserRole, UserSession } from '../types/user';
import { safeLocalStorageSet, safeLocalStorageGet } from './safeStorage';
import { db, doc, setDoc, getDoc, onSnapshot } from '../lib/firebase';
import { recordAdminActivityLog } from './adminLogTracker';
import { normalizeImageUrl } from './imageUrlHelper';

const STORAGE_KEY_USERS = 'kppn_users_data_v2';
const STORAGE_KEY_CURRENT_USER = 'kppn_current_user_session_v2';

export const DEFAULT_SUPERADMIN_USER: AppUser = {
  id: 'user-superadmin-026',
  username: 'admin',
  displayName: 'Admin Super KPPN 026',
  role: 'superadmin',
  jabatan: 'Super Administrator KPPN Semarang I',
  seksi: 'Seksi MSKI',
  nip: '198501012005011001',
  email: 'mski.kppn026@kemenkeu.go.id',
  noHp: '081234567890',
  photoUrl: '', // Default or customizable Google Drive URL
  customGreeting: 'Hai, Admin Super KPPN!',
  passwordRaw: 'kppn026',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString()
};

export const DEFAULT_PEGAWAI_USER: AppUser = {
  id: 'user-pegawai-mski-01',
  username: 'pegawai',
  displayName: 'Pegawai KPPN Semarang I',
  role: 'pegawai',
  jabatan: 'Pelaksana Seksi MSKI',
  seksi: 'Seksi MSKI',
  nip: '199205152014021002',
  email: 'pegawai.kppn026@kemenkeu.go.id',
  noHp: '081298765432',
  photoUrl: '',
  customGreeting: 'Halo Rekan Pegawai! Semangat melayani Satker hari ini',
  passwordRaw: 'pegawai026',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  lastLoginAt: undefined
};

export const INITIAL_USERS_LIST: AppUser[] = [
  DEFAULT_SUPERADMIN_USER,
  DEFAULT_PEGAWAI_USER
];

/**
 * Retrieves all stored users with memory cache and local storage fallback
 */
export function getStoredUsers(): AppUser[] {
  if (typeof window === 'undefined') return INITIAL_USERS_LIST;
  try {
    const raw = safeLocalStorageGet(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure at least one superadmin exists
        const hasSuperAdmin = parsed.some(u => u.role === 'superadmin');
        if (!hasSuperAdmin) {
          return [DEFAULT_SUPERADMIN_USER, ...parsed];
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored users:', err);
  }
  // Initialize with defaults if none exists
  saveStoredUsers(INITIAL_USERS_LIST, false);
  return INITIAL_USERS_LIST;
}

/**
 * Saves users to local storage and optionally syncs to Firestore
 */
export function saveStoredUsers(users: AppUser[], syncCloud: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    safeLocalStorageSet(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.warn('Error saving users to local storage:', err);
  }

  if (syncCloud) {
    syncUsersToFirestore(users).catch(err => {
      console.warn('Notice: Firestore user sync skipped or failed:', err);
    });
  }
}

/**
 * Persists users list to Firestore
 */
export async function syncUsersToFirestore(users: AppUser[]): Promise<void> {
  try {
    // 1. Dual-sync to server-side backup API
    fetch('/api/data/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    }).catch(err => console.warn('Notice: Server users backup sync notice:', err));

    // 2. Cloud Firestore sync
    const userDocRef = doc(db, 'data', 'users');
    await setDoc(userDocRef, {
      users,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore users sync notice:', err);
  }
}

/**
 * Real-time listener for users from Firestore
 */
export function subscribeUsers(callback: (users: AppUser[]) => void): () => void {
  // Fire initial immediately
  callback(getStoredUsers());

  try {
    const userDocRef = doc(db, 'data', 'users');
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.users) && data.users.length > 0) {
          saveStoredUsers(data.users, false);
          callback(data.users);
          
          // Also sync active user session if updated
          const current = getCurrentUser();
          if (current) {
            const updatedCurrent = data.users.find((u: AppUser) => u.id === current.id);
            if (updatedCurrent) {
              setCurrentUser(updatedCurrent);
            }
          }
          return;
        }
      }
      callback(getStoredUsers());
    }, (err) => {
      console.warn('Firestore users subscription notice:', err);
      callback(getStoredUsers());
    });

    return unsub;
  } catch (e) {
    return () => {};
  }
}

/**
 * Gets the currently logged-in user from session/local storage
 */
export function getCurrentUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    // Check sessionStorage first
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (sessionRaw) {
      return JSON.parse(sessionRaw);
    }
    // Check localStorage fallback
    const localRaw = safeLocalStorageGet(STORAGE_KEY_CURRENT_USER);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading current user session:', err);
  }
  return null;
}

/**
 * Sets the active user in both session and local storage
 */
export function setCurrentUser(user: AppUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      const userStr = JSON.stringify(user);
      sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, userStr);
      safeLocalStorageSet(STORAGE_KEY_CURRENT_USER, userStr);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  } catch (err) {
    console.warn('Error setting current user:', err);
  }
}

/**
 * Clears user session on logout
 */
export function clearCurrentUser(): void {
  setCurrentUser(null);
}

/**
 * Authenticates a user either by:
 * 1. Quick PIN: Admin Super default/custom PIN (e.g. "kppn026")
 * 2. Username & Password: For Admin Super or any Pegawai KPPN
 */
export function authenticateUser(
  identifier: string,
  passwordInput?: string,
  customAdminPin?: string
): { success: boolean; user?: AppUser; message?: string } {
  const cleanId = (identifier || '').trim();
  const cleanPassword = (passwordInput || '').trim();
  const currentPin = (customAdminPin || localStorage.getItem('kppn_admin_pin') || 'kppn026').trim();

  const users = getStoredUsers();

  // Mode 1: Quick PIN single-input login (if passwordInput is empty and cleanId matches PIN)
  if (!cleanPassword) {
    if (cleanId === currentPin || cleanId === 'kppn026') {
      let superAdmin = users.find(u => u.role === 'superadmin' && u.isActive);
      if (!superAdmin) {
        superAdmin = DEFAULT_SUPERADMIN_USER;
      }
      
      const now = new Date().toISOString();
      superAdmin = { ...superAdmin, lastLoginAt: now };
      
      // Update in storage
      const updatedList = users.map(u => u.id === superAdmin!.id ? superAdmin! : u);
      saveStoredUsers(updatedList);
      setCurrentUser(superAdmin);

      recordAdminActivityLog(
        'Login Sesi Admin Super (PIN Cepat)',
        'AUTH',
        `Admin Super berhasil login via Quick PIN PIN KPPN 026.`,
        'SUCCESS',
        superAdmin.displayName
      );

      return { success: true, user: superAdmin };
    }
  }

  // Mode 2: Username & Password authentication
  const targetUser = users.find(
    u => u.username.toLowerCase() === cleanId.toLowerCase()
  );

  if (!targetUser) {
    // Check if entered username is empty and password matches admin pin
    if (cleanPassword && (cleanPassword === currentPin || cleanPassword === 'kppn026')) {
      let superAdmin = users.find(u => u.role === 'superadmin' && u.isActive) || DEFAULT_SUPERADMIN_USER;
      setCurrentUser(superAdmin);
      return { success: true, user: superAdmin };
    }
    return { success: false, message: 'Username tidak ditemukan di database pengguna KPPN.' };
  }

  if (!targetUser.isActive) {
    return { success: false, message: 'Akun pengguna ini sedang dinonaktifkan oleh Admin Super.' };
  }

  // Verify password
  const expectedPassword = (targetUser.passwordRaw || '').trim();
  const isPasswordValid = 
    (cleanPassword && cleanPassword === expectedPassword) ||
    // For superadmin, allow admin PIN as alternative
    (targetUser.role === 'superadmin' && (cleanPassword === currentPin || cleanPassword === 'kppn026'));

  if (!isPasswordValid) {
    return { success: false, message: 'Password salah. Harap periksa kembali sandi Anda.' };
  }

  // Success
  const now = new Date().toISOString();
  const updatedUser: AppUser = {
    ...targetUser,
    lastLoginAt: now,
    updatedAt: now
  };

  const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
  saveStoredUsers(updatedUsers);
  setCurrentUser(updatedUser);

  recordAdminActivityLog(
    `Login Pengguna: ${updatedUser.role === 'superadmin' ? 'Admin Super' : 'Pegawai KPPN'}`,
    'AUTH',
    `${updatedUser.displayName} (${updatedUser.username}) berhasil masuk ke sistem ANGKASA KPPN.`,
    'SUCCESS',
    updatedUser.displayName
  );

  return { success: true, user: updatedUser };
}

/**
 * Updates an existing user's profile (used by Pegawai or Super Admin)
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<AppUser>
): Promise<{ success: boolean; user?: AppUser; message?: string }> {
  try {
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) {
      return { success: false, message: 'User tidak ditemukan.' };
    }

    const current = users[idx];
    
    // Normalize photo URL if Google Drive link provided
    let cleanPhoto = updates.photoUrl !== undefined ? updates.photoUrl.trim() : current.photoUrl;
    if (cleanPhoto) {
      cleanPhoto = normalizeImageUrl(cleanPhoto);
    }

    const updatedUser: AppUser = {
      ...current,
      ...updates,
      photoUrl: cleanPhoto,
      updatedAt: new Date().toISOString()
    };

    users[idx] = updatedUser;
    saveStoredUsers(users, true);

    // If current user is the one being updated, refresh session
    const active = getCurrentUser();
    if (active && active.id === userId) {
      setCurrentUser(updatedUser);
    }

    recordAdminActivityLog(
      'Pembaruan Profil Pengguna',
      'SETTINGS',
      `Profil pengguna "${updatedUser.displayName}" (${updatedUser.username}) diperbarui (Sapaan/Foto/Data/Password).`,
      'SUCCESS',
      updatedUser.displayName
    );

    return { success: true, user: updatedUser };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal memperbarui profil pengguna.' };
  }
}

/**
 * Adds a new user account (Only Super Admin can invoke this)
 */
export async function createNewUser(
  newUser: Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; user?: AppUser; message?: string }> {
  try {
    const users = getStoredUsers();
    const cleanUsername = newUser.username.trim().toLowerCase();

    if (!cleanUsername) {
      return { success: false, message: 'Username wajib diisi.' };
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh pengguna lain.` };
    }

    let photo = (newUser.photoUrl || '').trim();
    if (photo) {
      photo = normalizeImageUrl(photo);
    }

    const created: AppUser = {
      ...newUser,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      username: cleanUsername,
      photoUrl: photo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedList = [created, ...users];
    saveStoredUsers(updatedList, true);

    recordAdminActivityLog(
      `Pembuatan User Baru (${created.role === 'superadmin' ? 'Admin Super' : 'Pegawai'})`,
      'SETTINGS',
      `Admin Super membuat akun baru "${created.displayName}" (@${created.username}) untuk jabatan ${created.jabatan || '-'}.`,
      'SUCCESS',
      'Admin Super KPPN 026'
    );

    return { success: true, user: created };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menambahkan user baru.' };
  }
}

/**
 * Deletes a user (protected: cannot delete last superadmin)
 */
export async function deleteUserAccount(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const users = getStoredUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'User tidak ditemukan.' };
    }

    // Safety check: Cannot delete the last superadmin
    if (target.role === 'superadmin') {
      const superadminCount = users.filter(u => u.role === 'superadmin').length;
      if (superadminCount <= 1) {
        return { success: false, message: 'Tidak dapat menghapus satu-satunya Admin Super utama.' };
      }
    }

    const updatedList = users.filter(u => u.id !== userId);
    saveStoredUsers(updatedList, true);

    recordAdminActivityLog(
      'Penghapusan User Akun',
      'SETTINGS',
      `Akun pengguna "${target.displayName}" (@${target.username}) telah dihapus dari sistem.`,
      'WARNING',
      'Admin Super KPPN 026'
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menghapus user.' };
  }
}

const STORAGE_KEY_RESET_OTPS = 'kppn_password_reset_otps_v1';

interface ResetOtpRecord {
  userId: string;
  email: string;
  otp: string;
  expiresAt: number;
}

/**
 * Searches for an existing user by username or registered email
 */
export function findUserByUsernameOrEmail(identifier: string): AppUser | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  const users = getStoredUsers();
  return users.find(u => 
    u.username.toLowerCase() === clean || 
    (u.email && u.email.trim().toLowerCase() === clean)
  );
}

/**
 * Requests a password reset OTP for a given user account
 */
export function requestPasswordResetOtp(identifier: string): { 
  success: boolean; 
  user?: AppUser; 
  maskedEmail?: string; 
  otp?: string;
  message?: string 
} {
  const user = findUserByUsernameOrEmail(identifier);
  if (!user) {
    return { 
      success: false, 
      message: 'Akun dengan username atau email tersebut tidak ditemukan dalam sistem.' 
    };
  }

  if (!user.email || !user.email.trim()) {
    return {
      success: false,
      message: `Akun "${user.displayName}" (@${user.username}) belum mendaftarkan alamat email pemulihan. Silakan hubungi Super Admin Seksi MSKI untuk mereset kata sandi Anda.`
    };
  }

  // Generate 6 digit numeric code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // Valid for 15 minutes

  try {
    const raw = safeLocalStorageGet(STORAGE_KEY_RESET_OTPS);
    let records: Record<string, ResetOtpRecord> = raw ? JSON.parse(raw) : {};
    records[user.id] = {
      userId: user.id,
      email: user.email.trim(),
      otp,
      expiresAt
    };
    safeLocalStorageSet(STORAGE_KEY_RESET_OTPS, JSON.stringify(records));
  } catch (err) {
    console.warn('Error saving reset OTP:', err);
  }

  // Mask email for display: e.g. mski.kppn026@kemenkeu.go.id -> m***6@kemenkeu.go.id
  const email = user.email.trim();
  const parts = email.split('@');
  let maskedEmail = email;
  if (parts.length === 2) {
    const [local, domain] = parts;
    if (local.length <= 2) {
      maskedEmail = `${local.charAt(0)}*@${domain}`;
    } else {
      maskedEmail = `${local.charAt(0)}${'*'.repeat(Math.min(local.length - 2, 4))}${local.charAt(local.length - 1)}@${domain}`;
    }
  }

  return {
    success: true,
    user,
    maskedEmail,
    otp
  };
}

/**
 * Verifies the OTP and resets the user's password
 */
export async function verifyOtpAndResetPassword(
  userId: string,
  enteredOtp: string,
  newPasswordRaw: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const raw = safeLocalStorageGet(STORAGE_KEY_RESET_OTPS);
    if (!raw) {
      return { success: false, message: 'Kode reset tidak ditemukan atau telah kedaluwarsa. Silakan minta kode verifikasi baru.' };
    }

    const records: Record<string, ResetOtpRecord> = JSON.parse(raw);
    const record = records[userId];
    if (!record) {
      return { success: false, message: 'Kode reset tidak ditemukan untuk akun ini. Harap kirim ulang permintaan reset.' };
    }

    if (Date.now() > record.expiresAt) {
      delete records[userId];
      safeLocalStorageSet(STORAGE_KEY_RESET_OTPS, JSON.stringify(records));
      return { success: false, message: 'Kode verifikasi telah kedaluwarsa (berlaku 15 menit). Silakan kirim ulang kode baru.' };
    }

    if (record.otp.trim() !== enteredOtp.trim()) {
      return { success: false, message: 'Kode verifikasi OTP salah. Periksa kembali email Anda.' };
    }

    if (!newPasswordRaw || newPasswordRaw.length < 4) {
      return { success: false, message: 'Kata sandi baru minimal harus 4 karakter.' };
    }

    // Update password in users list
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const updatedUser: AppUser = {
      ...users[idx],
      passwordRaw: newPasswordRaw.trim(),
      updatedAt: new Date().toISOString()
    };
    users[idx] = updatedUser;
    saveStoredUsers(users, true);

    // Delete OTP record
    delete records[userId];
    safeLocalStorageSet(STORAGE_KEY_RESET_OTPS, JSON.stringify(records));

    recordAdminActivityLog(
      'Reset Mandiri Password via Email OTP',
      'AUTH',
      `Pengguna "${updatedUser.displayName}" (@${updatedUser.username}) berhasil memperbarui kata sandi melalui verifikasi email.`,
      'SUCCESS',
      updatedUser.displayName
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mereset kata sandi.' };
  }
}
