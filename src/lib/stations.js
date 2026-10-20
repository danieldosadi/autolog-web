export const STATIONS_KEY = 'autolog.stations.v1';
export function validateStation(station) {
  if (typeof station?.name !== 'string' || !station.name.trim()) return 'Informe o nome do posto.';
  if (typeof station.address !== 'string' || !station.address.trim()) return 'Informe o endereço ou local do posto.';
  const prices = [station.gasoline, station.ethanol];
  if (!prices.some(v => Number.isFinite(v) && v > 0) || prices.some(v => v != null && (!Number.isFinite(v) || v <= 0))) return 'Informe ao menos um preço maior que zero.';
  return '';
}
export function readStations(raw) {
  const stations = JSON.parse(raw || '[]');
  if (!Array.isArray(stations) || stations.some(s => typeof s.id !== 'string' || validateStation(s) || !Number.isFinite(Date.parse(s.updatedAt))) || new Set(stations.map(s => s.id)).size !== stations.length) throw Error('Cadastro de postos inválido.');
  return stations;
}
