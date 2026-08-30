import { db, doc, setDoc, getDoc } from '../lib/firebase';
import { RealisasiBelanjaRecord, MyIntressRecord } from '../types';

const CHUNK_SIZE = 600;

export interface SintesaSyncResult {
  records: RealisasiBelanjaRecord[];
  activeFileName: string;
  isEmpty: boolean;
}

export interface MyIntressSyncResult {
  records: MyIntressRecord[];
  activeFileName: string;
  waktuUnduh: string;
  isEmpty: boolean;
}

/**
 * Save SINTESA Realisasi dataset to Firestore with automatic chunking to respect 1MB limit.
 */
export async function saveSintesaToFirestore(
  records: RealisasiBelanjaRecord[],
  activeFileName: string
): Promise<boolean> {
  try {
    if (!Array.isArray(records) || records.length === 0) {
      await setDoc(doc(db, 'data', 'sintesa_realisasi'), {
        list: [],
        isEmpty: true,
        chunkCount: 0,
        totalRows: 0,
        activeFileName: activeFileName || 'Data Realisasi Belanja Kosong',
        updatedAt: new Date().toISOString()
      });
      return true;
    }

    const chunkCount = Math.ceil(records.length / CHUNK_SIZE);
    const chunkPromises: Promise<void>[] = [];

    for (let i = 0; i < chunkCount; i++) {
      const chunk = records.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      chunkPromises.push(
        setDoc(doc(db, 'data', `sintesa_chunk_${i}`), {
          chunkIndex: i,
          records: chunk,
          updatedAt: new Date().toISOString()
        })
      );
    }

    await Promise.all(chunkPromises);

    await setDoc(doc(db, 'data', 'sintesa_realisasi'), {
      isEmpty: false,
      chunkCount,
      totalRows: records.length,
      activeFileName: activeFileName || 'Data Realisasi Belanja SINTESA Kemenkeu',
      updatedAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('[firestoreDatasetSync] Error saving SINTESA to Firestore:', error);
    return false;
  }
}

/**
 * Fetch complete SINTESA Realisasi dataset from Firestore, merging chunks if needed.
 */
export async function fetchSintesaFromFirestore(): Promise<SintesaSyncResult | null> {
  try {
    const mainSnap = await getDoc(doc(db, 'data', 'sintesa_realisasi'));
    if (!mainSnap.exists()) {
      return null;
    }

    const data = mainSnap.data();
    if (data.isEmpty === true || (Array.isArray(data.list) && data.list.length === 0 && !data.chunkCount)) {
      return {
        records: [],
        activeFileName: data.activeFileName || 'Data Realisasi Belanja Kosong',
        isEmpty: true
      };
    }

    // If data was stored in chunks
    if (data.chunkCount && typeof data.chunkCount === 'number' && data.chunkCount > 0) {
      const chunkPromises: Promise<any>[] = [];
      for (let i = 0; i < data.chunkCount; i++) {
        chunkPromises.push(getDoc(doc(db, 'data', `sintesa_chunk_${i}`)));
      }

      const chunkSnaps = await Promise.all(chunkPromises);
      const allRecords: RealisasiBelanjaRecord[] = [];
      for (const snap of chunkSnaps) {
        if (snap.exists()) {
          const chunkData = snap.data();
          if (Array.isArray(chunkData.records)) {
            allRecords.push(...chunkData.records);
          }
        }
      }

      return {
        records: allRecords,
        activeFileName: data.activeFileName || 'Data Realisasi Belanja SINTESA Kemenkeu',
        isEmpty: allRecords.length === 0
      };
    }

    // Legacy fallback: stored in single doc 'list'
    if (Array.isArray(data.list)) {
      return {
        records: data.list,
        activeFileName: data.activeFileName || 'Data Realisasi Belanja SINTESA Kemenkeu',
        isEmpty: data.list.length === 0
      };
    }

    return null;
  } catch (error) {
    console.warn('[firestoreDatasetSync] Error fetching SINTESA from Firestore:', error);
    return null;
  }
}

/**
 * Save My InTress dataset to Firestore
 */
export async function saveMyIntressToFirestore(
  records: MyIntressRecord[],
  activeFileName: string,
  waktuUnduh: string
): Promise<boolean> {
  try {
    const isEmpty = !Array.isArray(records) || records.length === 0;
    await setDoc(doc(db, 'data', 'my_intress'), {
      list: records || [],
      isEmpty,
      totalSatker: (records || []).length,
      activeFileName: activeFileName || (isEmpty ? 'Data My InTress Kosong' : 'Data Realisasi Belanja My InTress'),
      waktuUnduh: waktuUnduh || '',
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('[firestoreDatasetSync] Error saving My InTress to Firestore:', error);
    return false;
  }
}

/**
 * Fetch My InTress dataset from Firestore
 */
export async function fetchMyIntressFromFirestore(): Promise<MyIntressSyncResult | null> {
  try {
    const snap = await getDoc(doc(db, 'data', 'my_intress'));
    if (!snap.exists()) return null;

    const data = snap.data();
    const isEmpty = data.isEmpty === true || (Array.isArray(data.list) && data.list.length === 0);

    return {
      records: Array.isArray(data.list) ? data.list : [],
      activeFileName: data.activeFileName || (isEmpty ? 'Data My InTress Kosong' : 'Data Realisasi Belanja My InTress'),
      waktuUnduh: data.waktuUnduh || '',
      isEmpty
    };
  } catch (error) {
    console.warn('[firestoreDatasetSync] Error fetching My InTress from Firestore:', error);
    return null;
  }
}
