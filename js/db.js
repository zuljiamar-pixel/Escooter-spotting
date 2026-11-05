// Speicherung der Spots in IndexedDB (Bilder sind zu groß für localStorage).
const DB_NAME = "escooter-spotting";
const STORE = "spots";
let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
  });
}

// Falls IndexedDB blockiert ist (z. B. privates Fenster): Spots nur im Speicher halten.
const memory = new Map();
async function safe(fn, fallback) {
  try { return await fn(); } catch { return fallback(); }
}

export const db = {
  all: async () => {
    const list = await safe(() => tx("readonly", (s) => s.getAll()), () => [...memory.values()]);
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },
  put: (spot) => safe(() => tx("readwrite", (s) => s.put(spot)), () => memory.set(spot.id, spot)),
  remove: (id) => safe(() => tx("readwrite", (s) => s.delete(id)), () => memory.delete(id)),
  clear: () => safe(() => tx("readwrite", (s) => s.clear()), () => memory.clear()),
};
