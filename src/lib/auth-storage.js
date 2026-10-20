import * as SecureStore from 'expo-secure-store';

// Split sessions so providers with large JWTs also fit on devices with small limits.
export const authStorage = {
  async getItem(key) {
    const raw = await SecureStore.getItemAsync(`${key}.meta`);
    if (!raw) return null;
    const { version, count } = JSON.parse(raw);
    if (!Number.isInteger(count) || count < 1 || count > 100) return null;
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${version}.${i}`)));
    return parts.some(p => p === null) ? null : parts.join('');
  },
  async setItem(key, value) {
    const previous = await SecureStore.getItemAsync(`${key}.meta`);
    const version = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const count = Math.ceil(value.length / 1500) || 1;
    for (let i = 0; i < count; i++) await SecureStore.setItemAsync(`${key}.${version}.${i}`, value.slice(i * 1500, (i + 1) * 1500));
    await SecureStore.setItemAsync(`${key}.meta`, JSON.stringify({ version, count }));
    if (previous) { const old = JSON.parse(previous); for (let i = 0; i < old.count; i++) await SecureStore.deleteItemAsync(`${key}.${old.version}.${i}`); }
  },
  async removeItem(key) {
    const raw = await SecureStore.getItemAsync(`${key}.meta`);
    await SecureStore.deleteItemAsync(`${key}.meta`);
    if (raw) { const old = JSON.parse(raw); for (let i = 0; i < old.count; i++) await SecureStore.deleteItemAsync(`${key}.${old.version}.${i}`); }
  },
};
