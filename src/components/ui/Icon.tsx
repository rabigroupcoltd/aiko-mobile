import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useTheme } from '@/theme';

export type IconName =
  | 'chevron-left'
  | 'menu'
  | 'map-pin'
  | 'shield-check'
  | 'bike'
  | 'zap'
  | 'package'
  | 'check'
  | 'x'
  | 'phone'
  | 'star'
  | 'chevron-right'
  | 'chevrons-right'
  | 'navigation'
  | 'clock'
  | 'message';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Fill the shape (e.g. a chosen star). Outline only by default. */
  fill?: string;
}

export function Icon({ name, size = 22, color, strokeWidth = 2, fill = 'none' }: IconProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.text;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {GLYPHS[name]}
    </Svg>
  );
}

const GLYPHS: Record<IconName, React.ReactNode> = {
  check: <Path d="M20 6 9 17l-5-5" />,
  x: (
    <>
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </>
  ),
  phone: (
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  star: (
    <Path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  ),
  'chevron-right': <Path d="m9 18 6-6-6-6" />,
  'chevrons-right': (
    <>
      <Path d="m6 17 5-5-5-5" />
      <Path d="m13 17 5-5-5-5" />
    </>
  ),
  // Points up; rotate by the heading to show travel direction.
  navigation: <Path d="M12 2 19 21l-7-4-7 4 7-19z" />,
  clock: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6l4 2" />
    </>
  ),
  message: <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
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
