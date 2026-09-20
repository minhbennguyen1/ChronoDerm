import { ClinicalCase, SkinTimelineFrame } from '../types';
import { SAMPLE_CASES } from '../data/sampleCases';

const DB_NAME = 'chronoderm_clinical_db_v4';
const DB_VERSION = 2;
const STORE_NAME = 'clinical_cases';
const LAST_SAVED_KEY = 'chronoderm_last_saved';

/**
 * Sorts timeline frames strictly in ascending chronological order:
 * Primary: day number
 * Secondary: week number
 * Tertiary: ISO date timestamp
 */
export function sortFramesChronologically(frames: SkinTimelineFrame[]): SkinTimelineFrame[] {
  return [...frames].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    if (a.week !== b.week) return a.week - b.week;
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Open native IndexedDB for reliable high-res image persistence
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'storageKey' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Generate clean default personal case for a new account (ZERO pre-existing dummy photos)
 */
export function createEmptyUserCase(userId: string, userName?: string): ClinicalCase {
  return {
    id: `case_${userId}_personal`,
    condition: 'Personal Skin Progress',
    patientInitials: userName ? userName.slice(0, 2).toUpperCase() : 'ME',
    age: 28,
    medication: 'Prescribed Regimen',
    prescribingHcp: 'Self-Monitored / HCP',
    targetAnatomy: 'Skin Area',
    silhouetteType: 'forearm',
    totalWeeks: 0,
    baselineSeverity: 'Active Tracking',
    currentSeverity: 'Active Tracking',
    adherenceRate: 100,
    frames: [], // Strictly EMPTY - zero pre-existing demo photos
  };
}

/**
 * Save cases partitioned by user account
 */
export async function saveUserCases(userId: string, cases: ClinicalCase[]): Promise<void> {
  const storageKey = `user_cases_${userId}`;

  // Sanitize and sort all frames
  const sanitized = cases.map((c) => ({
    ...c,
    frames: sortFramesChronologically(c.frames),
  }));

  // 1. Save to IndexedDB
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put({ storageKey, cases: sanitized });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[ChronoDerm] IndexedDB write failed, falling back to localStorage:', err);
  }

  // 2. LocalStorage backup
  try {
    localStorage.setItem(storageKey, JSON.stringify(sanitized));
    localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('[ChronoDerm] LocalStorage quota warning:', err);
  }
}

/**
 * Load cases partitioned by user account.
 * If isDemo is true (Try Now for new users), returns the clinical trial benchmark cases.
 * If isDemo is false (personal user account), loads their saved photos, or initializes a clean empty case with zero preexisting photos.
 */
export async function loadUserCases(userId: string, isDemo: boolean = false): Promise<ClinicalCase[]> {
  // New users trying the demo get the clinical trial benchmark cases
  if (isDemo) {
    return SAMPLE_CASES.map((c) => ({
      ...c,
      frames: sortFramesChronologically(c.frames),
    }));
  }

  const storageKey = `user_cases_${userId}`;

  // 1. Try IndexedDB
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(storageKey);

    const record = await new Promise<any>((resolve, reject) => {
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    });

    if (record && Array.isArray(record.cases) && record.cases.length > 0) {
      return record.cases.map((c: ClinicalCase) => ({
        ...c,
        frames: sortFramesChronologically(c.frames),
      }));
    }
  } catch (err) {
    console.warn('[ChronoDerm] IndexedDB read failed, trying localStorage:', err);
  }

  // 2. Try localStorage
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: ClinicalCase) => ({
          ...c,
          frames: sortFramesChronologically(c.frames),
        }));
      }
    }
  } catch (err) {
    console.warn('[ChronoDerm] LocalStorage read failed:', err);
  }

  // 3. User account has NO prior cases: initialize a clean personal case with ZERO preexisting photos
  const freshCase = createEmptyUserCase(userId);
  await saveUserCases(userId, [freshCase]);
  return [freshCase];
}

/**
 * Clear cases for a specific user
 */
export async function clearUserCases(userId: string): Promise<ClinicalCase[]> {
  const storageKey = `user_cases_${userId}`;
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(storageKey);
  } catch (e) {
    // Ignore
  }
  try {
    localStorage.removeItem(storageKey);
  } catch (e) {
    // Ignore
  }

  const freshCase = createEmptyUserCase(userId);
  await saveUserCases(userId, [freshCase]);
  return [freshCase];
}

// Legacy wrappers for backward compatibility
export async function saveCasesToStorage(cases: ClinicalCase[]): Promise<void> {
  return saveUserCases('default', cases);
}

export async function loadCasesFromStorage(): Promise<ClinicalCase[]> {
  return loadUserCases('default', false);
}

export async function resetCasesToDefault(): Promise<ClinicalCase[]> {
  return clearUserCases('default');
}

export function getLastSavedTimestamp(): string | null {
  try {
    return localStorage.getItem(LAST_SAVED_KEY);
  } catch {
    return null;
  }
}
