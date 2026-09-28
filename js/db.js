/* 記帳王 - IndexedDB storage layer (with localStorage fallback) */
const DB = (() => {
  const NAME = 'jizhangwang', VER = 1;
  let db = null, useLS = false;
  const LSK = 'jzw-db-';
  const p = req => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
  function open() {
    return new Promise((res) => {
      if (!('indexedDB' in window)) { useLS = true; return res(); }
      let r;
      try { r = indexedDB.open(NAME, VER); } catch (e) { useLS = true; return res(); }
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('tx')) d.createObjectStore('tx', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      };
      r.onsuccess = () => { db = r.result; res(); };
      r.onerror = () => { useLS = true; res(); };
      r.onblocked = () => { useLS = true; res(); };
    });
  }
  const store = (name, mode) => db.transaction(name, mode).objectStore(name);
  const lsTx = () => JSON.parse(localStorage.getItem(LSK + 'tx') || '{}');
  const lsSaveTx = m => localStorage.setItem(LSK + 'tx', JSON.stringify(m));
  return {
    open,
    get mode() { return useLS ? 'localStorage' : 'IndexedDB'; },
    async getAllTx() { if (useLS) return Object.values(lsTx()); return p(store('tx', 'readonly').getAll()); },
    async putTx(t) { if (useLS) { const m = lsTx(); m[t.id] = t; return lsSaveTx(m); } return p(store('tx', 'readwrite').put(t)); },
    async delTx(id) { if (useLS) { const m = lsTx(); delete m[id]; return lsSaveTx(m); } return p(store('tx', 'readwrite').delete(id)); },
    async replaceAllTx(list) {
      if (useLS) { const m = {}; list.forEach(t => m[t.id] = t); return lsSaveTx(m); }
      return new Promise((res, rej) => {
        const t = db.transaction('tx', 'readwrite'); const s = t.objectStore('tx');
        s.clear(); list.forEach(x => s.put(x));
        t.oncomplete = () => res(); t.onerror = () => rej(t.error);
      });
    },
    async get(k) { if (useLS) { const v = localStorage.getItem(LSK + k); return v == null ? undefined : JSON.parse(v); } return p(store('kv', 'readonly').get(k)); },
    async set(k, v) { if (useLS) return localStorage.setItem(LSK + k, JSON.stringify(v)); return p(store('kv', 'readwrite').put(JSON.parse(JSON.stringify(v)), k)); },
  };
})();
