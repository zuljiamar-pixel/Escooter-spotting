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

export const db = {
  all: async () => {
    const list = await tx("readonly", (s) => s.getAll());
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },
  put: (spot) => tx("readwrite", (s) => s.put(spot)),
  remove: (id) => tx("readwrite", (s) => s.delete(id)),
  clear: () => tx("readwrite", (s) => s.clear()),
};
