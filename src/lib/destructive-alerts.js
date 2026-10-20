let pending = [];
const listeners = new Set();
const emit = () => listeners.forEach(listener => listener());
export const destructiveAlerts = {
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  snapshot() { return pending[0] || null; },
  show(title, message, buttons, options) { pending = [...pending, { title, message, buttons, options }]; emit(); },
  close() { pending = pending.slice(1); emit(); },
};
