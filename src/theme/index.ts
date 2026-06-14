export const COLORS = {
  primary: '#00A859', // Aiko Green
  secondary: '#007D41', // Darker Aiko Green
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#1A1A1A',
  textMuted: '#6C757D',
  border: '#E9ECEF',
  white: '#FFFFFF',
  black: '#000000',
  error: '#DC3545',
  success: '#00A859',
  warning: '#FFC107',
  // Map route markers
  pickup: '#2E7D32',
  dropoff: '#FF4B4B',
  // Translucent overlays
  overlay: 'rgba(0,0,0,0.45)',
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SIZES = {
  radius: 24,
  buttonHeight: 56,
};
