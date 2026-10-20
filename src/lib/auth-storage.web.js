// Browser-only session persistence; native continues using SecureStore.
export const authStorage = {
  async getItem(key) { return typeof window === 'undefined' ? null : window.localStorage.getItem(key); },
  async setItem(key, value) { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); },
  async removeItem(key) { if (typeof window !== 'undefined') window.localStorage.removeItem(key); },
};
