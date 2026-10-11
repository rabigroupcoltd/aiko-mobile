import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useTheme } from '@/theme';

export type IconName =
  | 'chevron-left'
  | 'menu'
  | 'map-pin'
  | 'shield-check'
  | 'bike'
  | 'zap'
  | 'package';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color, strokeWidth = 2 }: IconProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.text;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {GLYPHS[name]}
    </Svg>
  );
}

const GLYPHS: Record<IconName, React.ReactNode> = {
  'chevron-left': <Path d="m15 18-6-6 6-6" />,
  menu: (
    <>
      <Line x1="4" x2="20" y1="6" y2="6" />
      <Line x1="4" x2="20" y1="12" y2="12" />
      <Line x1="4" x2="14" y1="18" y2="18" />
    </>
  ),
  'map-pin': (
    <>
      <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <Circle cx="12" cy="10" r="3" />
    </>
  ),
  'shield-check': (
    <>
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <Path d="m9 12 2 2 4-4" />
    </>
  ),
  bike: (
    <>
      <Circle cx="18.5" cy="17.5" r="3.5" />
      <Circle cx="5.5" cy="17.5" r="3.5" />
      <Circle cx="15" cy="5" r="1" />
      <Path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </>
  ),
  zap: (
    <Path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  ),
  package: (
    <>
      <Path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <Path d="M12 22V12" />
      <Path d="m3.3 7 8.7 5 8.7-5" />
      <Path d="m7.5 4.27 9 5.15" />
    </>
  ),
};
