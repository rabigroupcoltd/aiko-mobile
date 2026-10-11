import { Image, Text, View, type ImageStyle, type ViewStyle } from 'react-native';

import { green, makeStyles } from '@/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle & ImageStyle;
}

const TINTS = [green[500], green[600], green[400], green[700], green[300]];

function initialsOf(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tintOf(name?: string): string {
  if (!name) return green[500];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

export function Avatar({ uri, name, size = 48, style }: AvatarProps) {
  const styles = useStyles();
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, dimension, style]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[styles.fallback, dimension, { backgroundColor: tintOf(name) }, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  image: { backgroundColor: colors.surfaceAlt },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '700' },
}));
