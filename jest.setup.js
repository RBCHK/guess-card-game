// Jest setup file
// MMKV mock — in-memory implementation for test environment

const mmkvStores = new Map();

jest.mock('react-native-mmkv', () => {
  return {
    MMKV: class MMKV {
      constructor(config) {
        const id = (config && config.id) || 'default';
        if (!mmkvStores.has(id)) {
          mmkvStores.set(id, new Map());
        }
        this._store = mmkvStores.get(id);
      }
      getString(key) {
        const v = this._store.get(key);
        return typeof v === 'string' ? v : undefined;
      }
      getNumber(key) {
        const v = this._store.get(key);
        return typeof v === 'number' ? v : undefined;
      }
      getBoolean(key) {
        const v = this._store.get(key);
        return typeof v === 'boolean' ? v : undefined;
      }
      set(key, value) {
        this._store.set(key, value);
      }
      delete(key) {
        this._store.delete(key);
      }
      contains(key) {
        return this._store.has(key);
      }
      clearAll() {
        this._store.clear();
      }
      getAllKeys() {
        return Array.from(this._store.keys());
      }
    },
  };
});

// Expose for test cleanup
global.__clearMMKVStores = () => mmkvStores.clear();
