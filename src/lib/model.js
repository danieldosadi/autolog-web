export const KEY = 'autolog.records.v1';
export const num = (v, d = 1) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const money = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const parse = v => { let s = String(v).trim(); if (s.includes(',')) s = s.replaceAll('.', '').replace(',', '.'); return Number(s); };
export const ordered = entries => [...entries].sort((a, b) => a.odo - b.odo);
export function calculateFuel(distance, consumption, price) {
  if (![distance, consumption, price].every(v => Number.isFinite(v) && v > 0)) throw Error('Informe distância, consumo e preço por litro maiores que zero.');
  const liters = distance / consumption;
  const cost = liters * price;
  if (!Number.isFinite(liters) || !Number.isFinite(cost)) throw Error('Os valores informados são muito altos.');
  return { liters, cost };
}
export function sumDistances(values) {
  const distances = values.map(parse);
  if (!distances.length || distances.some(v => !Number.isFinite(v) || v <= 0)) throw Error('Informe uma distância maior que zero para cada trecho ou remova o trecho vazio.');
  const total = distances.reduce((sum, distance) => sum + distance, 0);
  if (!Number.isFinite(total)) throw Error('A distância total é muito alta.');
  return total;
}
export function tankPlan(liters, capacity) {
  if (![liters, capacity].every(v => Number.isFinite(v) && v > 0)) throw Error('Informe uma capacidade de tanque maior que zero.');
  const ratio = liters / capacity;
  const tanks = Math.ceil(ratio - Number.EPSILON * Math.max(1, ratio));
  if (!Number.isSafeInteger(tanks)) throw Error('Verifique a capacidade informada.');
  return { tanks, stops: Math.max(0, tanks - 1) };
}
export function calculateMixedFuel(segments, cityConsumption, highwayConsumption, price) {
  if (![cityConsumption, highwayConsumption, price].every(v => Number.isFinite(v) && v > 0)) throw Error('Informe os dois consumos e o preço por litro maiores que zero.');
  sumDistances(segments.map(s => s.distance));
  let cityLiters = 0, highwayLiters = 0;
  for (const segment of segments) {
    if (segment.type === 'city') cityLiters += segment.distance / cityConsumption;
    else if (segment.type === 'highway') highwayLiters += segment.distance / highwayConsumption;
    else throw Error('Selecione Urbano ou Estrada para cada trecho.');
  }
  const liters = cityLiters + highwayLiters, cost = liters * price;
  if (!Number.isFinite(liters) || !Number.isFinite(cost)) throw Error('Verifique as distâncias e os consumos informados.');
  return { liters, cost, cityLiters, highwayLiters };
}
export function cycles(entries) {
  let anchor = null, liters = 0; const result = [];
  for (const e of ordered(entries)) {
    if (anchor) liters += e.volume;
    if (e.full) {
      if (anchor && e.odo > anchor.odo && liters > 0) result.push({ date: e.date, value: (e.odo - anchor.odo) / liters, distance: e.odo - anchor.odo, liters });
      anchor = e; liters = 0;
    }
  }
  return result;
}
export function validate(r, others = []) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !Number.isFinite(new Date(r.date + 'T12:00:00Z').getTime()) || new Date(r.date + 'T12:00:00Z').toISOString().slice(0, 10) !== r.date) return 'Informe uma data válida no formato DD/MM/AAAA.';
  if (!Number.isFinite(r.odo) || r.odo < 0 || ![r.volume, r.price, r.total].every(v => Number.isFinite(v) && v > 0)) return 'Informe odômetro válido e litros, preço e total maiores que zero.';
  if (Math.abs(r.volume * r.price - r.total) > Math.max(.1, r.volume * .0006)) return 'O total deve corresponder aos litros multiplicados pelo preço.';
  if (others.some(e => e.odo === r.odo)) return 'Já existe um registro com esse odômetro.';
  if (others.some(e => (e.date < r.date && e.odo > r.odo) || (e.date > r.date && e.odo < r.odo))) return 'O odômetro deve acompanhar a ordem das datas.';
  return '';
}
export function readBackup(data) {
  if (data.app !== 'AutoLog' || data.version !== 1 || !Array.isArray(data.entries)) throw Error('Arquivo de backup inválido.');
  const clean = [];
  for (const r of data.entries) {
    if (typeof r.id !== 'string' || typeof r.full !== 'boolean' || typeof r.station !== 'string' || !['Gasolina', 'Etanol', 'Diesel', 'GNV'].includes(r.fuel) || validate(r, clean) || clean.some(x => x.id === r.id)) throw Error('O backup contém registros inválidos.');
    clean.push({ id: r.id, date: r.date, odo: r.odo, volume: r.volume, price: r.price, total: r.total, station: r.station.slice(0, 100), fuel: r.fuel, full: r.full });
  }
  return clean;
}
