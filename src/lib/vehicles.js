export const VEHICLES_KEY = 'autolog.vehicles.v1';
export function validateVehicle(v) {
  if (!v || !['car', 'motorcycle'].includes(v.type)) return 'Selecione Moto ou Carro.';
  if (typeof v.brand !== 'string' || !v.brand.trim() || typeof v.model !== 'string' || !v.model.trim()) return 'Informe marca e modelo.';
  if (![v.capacity, v.city, v.highway].every(n => Number.isFinite(n) && n > 0)) return 'Informe tanque e consumos maiores que zero.';
  return '';
}
export function readVehicles(raw) {
  const list = JSON.parse(raw || '[]');
  if (!Array.isArray(list) || list.some(v => typeof v.id !== 'string' || validateVehicle(v)) || new Set(list.map(v => v.id)).size !== list.length) throw Error('Cadastro de veículos inválido.');
  return list;
}
