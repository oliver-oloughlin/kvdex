type ObjectStoreRecord = Record<string, IDBObjectStoreParameters | null>;

type IndexedDbOptions = {
  name: string;
  stores: ObjectStoreRecord;
  version?: number;
};

export async function openIndexedDb(
  { name, stores, version }: IndexedDbOptions,
) {
  const request = indexedDB.open(name, version);

  return await new Promise<IDBDatabase>((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      Object.entries(stores).forEach(([storeName, options]) => {
        db.createObjectStore(storeName, options ?? undefined);
      });
    };
  });
}
