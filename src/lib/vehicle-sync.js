import { readVehicles } from './vehicles';

// All reads/writes share one queue, so a network refresh cannot erase an edit.
export function createVehicleSync({ storage, client, userId, cacheKey, onChange: change, onStatus: status }) {
  let active = true;
  const onChange = next => { if (active) change(next); };
  const onStatus = next => { if (active) status(next); };
  const pendingKey = `${cacheKey}.pending.v1`, migratedKey = `${cacheKey}.cloud-migrated.v1`;
  let tail = Promise.resolve(), syncing = null;
  const queue = task => { const result = tail.then(task); tail = result.catch(() => {}); return result; };
  const row = (id, payload) => ({ user_id: userId, id, payload, deleted: payload === null });
  async function syncNow() {
    onStatus('syncing');
    try {
      const local = readVehicles(await storage.getItem(cacheKey));
      if (!(await storage.getItem(migratedKey))) {
        // Import legacy local vehicles only if that ID has never existed remotely.
        // Existing remote edits and deletion tombstones always win this migration.
        if (local.length) {
          const { error } = await client.from('autolog_vehicles').upsert(local.map(v => row(v.id, v)), { onConflict: 'user_id,id', ignoreDuplicates: true });
          if (error) throw error;
        }
        await storage.setItem(migratedKey, '1');
      }
      const pending = JSON.parse(await storage.getItem(pendingKey) || '{}');
      const changes = Object.entries(pending).map(([id, payload]) => row(id, payload));
      if (changes.length) {
        const { error } = await client.from('autolog_vehicles').upsert(changes, { onConflict: 'user_id,id' });
        if (error) throw error;
      }
      const rows = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await client.from('autolog_vehicles').select('id,payload,deleted').eq('user_id', userId).order('id').range(offset, offset + 999);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 1000) break;
      }
      const checked = readVehicles(JSON.stringify(rows.filter(v => !v.deleted).map(v => v.payload)));
      await storage.multiSet([[cacheKey, JSON.stringify(checked)], [pendingKey, '{}']]);
      onChange(checked); onStatus('synced');
      return true;
    } catch { onStatus('offline'); return false; }
  }
  return {
    setActive: value => { active = value; },
    sync: () => { if (!syncing) syncing = queue(syncNow).finally(() => { syncing = null; }); return syncing; },
    save: (next, baseline) => queue(async () => {
      const checked = readVehicles(JSON.stringify(next));
      const previous = new Map(baseline.map(v => [v.id, v]));
      const wanted = new Map(checked.map(v => [v.id, v]));
      const current = new Map(readVehicles(await storage.getItem(cacheKey)).map(v => [v.id, v]));
      const pending = JSON.parse(await storage.getItem(pendingKey) || '{}');
      for (const [id, vehicle] of wanted) {
        if (JSON.stringify(vehicle) !== JSON.stringify(previous.get(id))) { pending[id] = vehicle; current.set(id, vehicle); }
      }
      for (const id of previous.keys()) if (!wanted.has(id)) { pending[id] = null; current.delete(id); }
      const merged = [...current.values()];
      await storage.multiSet([[cacheKey, JSON.stringify(merged)], [pendingKey, JSON.stringify(pending)]]);
      onChange(merged); onStatus('pending');
      return true;
    }),
  };
}
