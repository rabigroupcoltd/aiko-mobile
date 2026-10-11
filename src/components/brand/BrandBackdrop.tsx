import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

export function BrandBackdrop() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#21B85A" />
          <Stop offset="0.5" stopColor="#0D8A41" />
          <Stop offset="1" stopColor="#054A22" />
        </LinearGradient>
        <RadialGradient id={`glow${id}`} cx="0.15" cy="0.08" r="0.6">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Rect width="400" height="800" fill={`url(#bg${id})`} />
      <Rect width="400" height="800" fill={`url(#glow${id})`} />

      <Path
        d="M-20 640 C 80 560, 60 440, 180 420 S 330 300, 420 160"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.14}
        strokeWidth={3}
        strokeDasharray="2 12"
        strokeLinecap="round"
      />
      <Circle cx="340" cy="130" r="120" fill="#FFFFFF" fillOpacity={0.04} />
      <Circle cx="40" cy="720" r="160" fill="#000000" fillOpacity={0.08} />
    </Svg>
  );
}
