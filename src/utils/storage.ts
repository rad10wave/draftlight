import { DesignTab, ThemeMode } from '../types';

const DB_NAME = 'draftlight';
const DB_VERSION = 1;
const STORE_DESIGNS = 'designs';
const STORE_META = 'metadata';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DESIGNS)) {
        db.createObjectStore(STORE_DESIGNS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.warn('IndexedDB failed to open, fallback to in-memory');
      reject(request.error);
    };
  });
}

export async function saveTabsToStorage(tabs: DesignTab[], activeTabId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_DESIGNS, STORE_META], 'readwrite');
    const designStore = tx.objectStore(STORE_DESIGNS);
    const metaStore = tx.objectStore(STORE_META);

    // Clear existing designs
    designStore.clear();

    // Store designs without gigantic history to keep storage fast
    for (const tab of tabs) {
      if (!tab) continue;
      const sanitizedTab = {
        ...tab,
        scale: tab.scale || '1:100',
        units: tab.units || 'm',
        history: Array.isArray(tab.history) ? tab.history.slice(-10) : [], // keep last 10 for storage
      };
      designStore.put(sanitizedTab);
    }

    metaStore.put({ key: 'activeTabId', value: activeTabId });
  } catch (err) {
    console.warn('Could not save to IndexedDB:', err);
  }
}

export async function loadTabsFromStorage(): Promise<{ tabs: DesignTab[]; activeTabId: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_DESIGNS, STORE_META], 'readonly');
      const designStore = tx.objectStore(STORE_DESIGNS);
      const metaStore = tx.objectStore(STORE_META);

      const designsReq = designStore.getAll();
      const metaReq = metaStore.get('activeTabId');

      let designs: DesignTab[] = [];
      let activeTabId = '';

      designsReq.onsuccess = () => {
        designs = designsReq.result || [];
      };

      metaReq.onsuccess = () => {
        activeTabId = metaReq.result?.value || '';
      };

      tx.oncomplete = () => {
        if (designs.length > 0) {
          const validated = designs
            .filter((t): t is DesignTab => !!t && typeof t === 'object')
            .map((t) => ({
              ...t,
              id: t.id || `design-${Date.now()}`,
              name: t.name || 'Untitled Plan',
              scale: t.scale === '1:50' || t.scale === '1:100' || t.scale === '1:200' ? t.scale : '1:100',
              units: t.units || 'm',
              rooms: Array.isArray(t.rooms) ? t.rooms : [],
              walls: Array.isArray(t.walls) ? t.walls : [],
              furniture: Array.isArray(t.furniture) ? t.furniture : [],
              dimensions: Array.isArray(t.dimensions) ? t.dimensions : [],
              redlines: Array.isArray(t.redlines) ? t.redlines : [],
              layers: t.layers && typeof t.layers === 'object' ? t.layers : {},
              ghostSketch: t.ghostSketch || null,
              gridVisible: typeof t.gridVisible === 'boolean' ? t.gridVisible : true,
              focusLight: typeof t.focusLight === 'boolean' ? t.focusLight : false,
            })) as DesignTab[];

          if (validated.length > 0) {
            resolve({ tabs: validated, activeTabId: activeTabId || validated[0].id });
            return;
          }
        }
        resolve(null);
      };

      tx.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

// LocalStorage for Theme
export function getSavedTheme(): ThemeMode {
  try {
    const val = localStorage.getItem('draftlight_theme');
    if (val === 'draftlight' || val === 'classic' || val === 'trace') {
      return val;
    }
  } catch {}
  return 'draftlight';
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem('draftlight_theme', theme);
  } catch {}
}

export const saveProject = saveTabsToStorage;
export const loadProject = loadTabsFromStorage;
