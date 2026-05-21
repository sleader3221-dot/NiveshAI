const STORAGE_PREFIX = 'niveshai_entity_';
const isBrowser = typeof window !== 'undefined';

const getStorageKey = (entityName) => `${STORAGE_PREFIX}${entityName}`;

const loadEntityItems = (entityName) => {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(getStorageKey(entityName));
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
};

const saveEntityItems = (entityName, items) => {
  if (!isBrowser) return;
  window.localStorage.setItem(getStorageKey(entityName), JSON.stringify(items));
};

const createId = () => {
  if (isBrowser && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const matchesCriteria = (item, criteria) => {
  if (!criteria || typeof criteria !== 'object') return true;
  return Object.entries(criteria).every(([key, value]) => {
    if (value === undefined || value === null) return true;
    if (Array.isArray(value)) {
      return value.includes(item[key]);
    }
    return item[key] === value;
  });
};

const createEntityMethods = (entityName) => ({
  list: async () => {
    return loadEntityItems(entityName);
  },
  filter: async (criteria = {}, sortOrder) => {
    const items = loadEntityItems(entityName);
    const filtered = items.filter((item) => matchesCriteria(item, criteria));
    if (typeof sortOrder === 'string' && sortOrder.startsWith('-')) {
      const field = sortOrder.slice(1);
      return [...filtered].sort((a, b) => {
        if (a[field] === b[field]) return 0;
        return a[field] > b[field] ? -1 : 1;
      });
    }
    return filtered;
  },
  get: async (id) => {
    const items = loadEntityItems(entityName);
    return items.find((item) => item.id === id) || null;
  },
  create: async (data) => {
    const items = loadEntityItems(entityName);
    const item = {
      id: data.id || createId(),
      ...data,
      created_at: data.created_at || new Date().toISOString(),
    };
    items.push(item);
    saveEntityItems(entityName, items);
    return item;
  },
  update: async (id, data) => {
    const items = loadEntityItems(entityName);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }
    items[index] = { ...items[index], ...data };
    saveEntityItems(entityName, items);
    return items[index];
  },
  delete: async (id) => {
    const items = loadEntityItems(entityName);
    const filtered = items.filter((item) => item.id !== id);
    saveEntityItems(entityName, filtered);
    return { id };
  },
});

export const db = {
  entities: new Proxy({}, {
    get: (_target, entityName) => createEntityMethods(entityName),
  }),
};

export default db;
