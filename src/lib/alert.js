import { Alert as NativeAlert } from 'react-native';
import { destructiveAlerts } from './destructive-alerts';
export const Alert = {
  alert(title, message, buttons, options) {
    if (buttons?.some(button => button.style === 'destructive')) { destructiveAlerts.show(title, message, buttons, options); return; }
    NativeAlert.alert(title, message, buttons, options);
  },
};
