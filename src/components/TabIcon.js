import React from 'react';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

export default function TabIcon({ name, color, size = 24 }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {name === 'dashboard' && <><Rect x="3" y="3" width="7" height="10" rx="1.5" /><Rect x="14" y="3" width="7" height="6" rx="1.5" /><Rect x="3" y="17" width="7" height="4" rx="1.5" /><Rect x="14" y="13" width="7" height="8" rx="1.5" /></>}
    {name === 'history' && <><Path d="M3 10a9 9 0 1 1 1.5 7" /><Path d="M3 4v6h6M12 7v5l3 2" /></>}
    {name === 'calculate' && <><Rect x="4" y="2" width="16" height="20" rx="3" /><Rect x="7.5" y="5.5" width="9" height="4" rx="1" /><Path d="M8 13h1m6 0h1m-8 4h1m6 0h1" /></>}
    {name === 'account' && <><Circle cx="12" cy="8" r="4" /><Path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>}
  </Svg>;
}
