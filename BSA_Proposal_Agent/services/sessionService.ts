import { SavedSession, SessionSummary } from '../types';

const DB_NAME = 'nubi_proposals_db';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

/**
 * Open or initialize the IndexedDB
 */
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not supported in this browser."));
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("IndexedDB error:", request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                console.log("Creating session store...");
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

/**
 * Save a full session (creates or updates)
 */
export const saveSession = async (session: SavedSession): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(session);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

/**
 * Load a full session by ID
 */
export const loadSession = async (id: string): Promise<SavedSession | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

/**
 * List all sessions (Summary only)
 * Note: IndexedDB getAll() retrieves full objects. For efficiency with large images,
 * we typically use a cursor. But for simplicity here with < 50 sessions, getting all is okay.
 * Optimization: If images make it huge, we might need a separate 'meta' store. 
 * For now, we'll strip images here before returning summary.
 */
export const listSessions = async (): Promise<SessionSummary[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const sessions = request.result as SavedSession[];
            // Map to summary to avoid passing huge image strings to UI components needlessly
            const summaries: SessionSummary[] = sessions.map(s => ({
                id: s.id,
                name: s.name,
                timestamp: s.timestamp,
                lastModified: s.lastModified,
                previewText: `${s.data.request?.companyName || 'Draft'} - ${s.data.request?.hyperScaler || ''}`
            })).sort((a, b) => b.lastModified - a.lastModified);

            resolve(summaries);
        };
    });
};

/**
 * Delete a session
 */
export const deleteSession = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};
