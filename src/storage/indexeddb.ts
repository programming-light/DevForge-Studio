export async function setKV(key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('devforge-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('kv', 'readwrite');
      const store = tx.objectStore('kv');
      store.put(value, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getKV<T = any>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('devforge-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('kv', 'readonly');
      const store = tx.objectStore('kv');
      const getReq = store.get(key);
      getReq.onsuccess = () => { db.close(); resolve(getReq.result as T | undefined); };
      getReq.onerror = () => { db.close(); reject(getReq.error); };
    };
    req.onerror = () => reject(req.error);
  });
}