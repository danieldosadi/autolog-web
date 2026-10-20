export const Alert = {
  alert(title, message = '', buttons, options) {
    if (typeof window === 'undefined') return;
    const text = [title, message].filter(Boolean).join('\n\n');
    if (!buttons?.length) { window.alert(text); return; }
    const action = buttons.find(button => button.style !== 'cancel');
    const cancel = buttons.find(button => button.style === 'cancel');
    if (buttons.length === 1) { window.alert(text); action?.onPress?.(); return; }
    if (window.confirm(text)) action?.onPress?.(); else { cancel?.onPress?.(); options?.onDismiss?.(); }
  },
};
