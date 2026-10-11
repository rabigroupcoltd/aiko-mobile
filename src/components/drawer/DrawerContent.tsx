import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar, Chip, ListRow } from '@/components/ui';
import { useLogoutManager } from '@/modules/auth/authController';
import { useOnboardingState } from '@/modules/onboarding/onboardingController';
import { ROUTES } from '@/navigation/routes';
import { useOpenCamera } from '@/navigation/useAppNavigation';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { makeStyles, radius, spacing } from '@/theme';
import { formatE164ForDisplay } from '@/utils/phone';

export function DrawerContent(props: DrawerContentComponentProps) {
  const { navigation, state } = props;
  const styles = useStyles();

  const user = useAuthStore((s) => s.user);
  const onboarding = useOnboardingState();
  const localPhoto = useAppStore((s) => s.photos.profile);
  const { logout } = useLogoutManager();
  const openCamera = useOpenCamera();

  const isRider = onboarding?.accountType === 'RIDER';
  const activeRoute = state.routeNames[state.index];
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest';

  const roleChip = isRider
    ? onboarding?.driver.status === 'APPROVED'
      ? { label: 'Rider · Approved', tone: 'success' as const }
      : { label: 'Rider · Pending', tone: 'pending' as const }
    : { label: 'Passenger', tone: 'brand' as const };

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          navigation.closeDrawer();
          setTimeout(() => void logout(), 260);
        },
      },
    ]);
  };

  const go = (route: string) => () => navigation.navigate(route as never);

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Avatar uri={localPhoto?.uri ?? user?.profilePhotoUrl ?? undefined} name={fullName} size={64} />
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName}
            </Text>
            {user?.phone ? (
              <Text style={styles.phone}>{formatE164ForDisplay(user.phone)}</Text>
            ) : null}
          </View>
          <Chip label={roleChip.label} tone={roleChip.tone} dot />
        </View>

        <View style={styles.divider} />

        <View style={styles.items}>
          <ListRow
            icon={isRider ? '🏍️' : '🏠'}
            title={isRider ? 'Dashboard' : 'Book a ride'}
            onPress={go(ROUTES.HOME_TAB)}
            style={activeRoute === ROUTES.HOME_TAB ? styles.activeRow : undefined}
          />
          <ListRow
            icon="👤"
            title="Profile"
            onPress={go(ROUTES.PROFILE)}
            style={activeRoute === ROUTES.PROFILE ? styles.activeRow : undefined}
          />
          <ListRow
            icon="📷"
            title="Edit photo"
            subtitle="Retake your profile picture"
            onPress={() => {
              navigation.closeDrawer();
              openCamera('profile');
            }}
          />
          <ListRow
            icon="🗂️"
            title={isRider ? 'My orders' : 'Order history'}
            subtitle={isRider ? 'Active, completed and skipped' : 'Past and active orders'}
            onPress={go(ROUTES.ORDER_HISTORY)}
            style={activeRoute === ROUTES.ORDER_HISTORY ? styles.activeRow : undefined}
          />
          {isRider ? (
            <>
              <ListRow
                icon="💰"
                title="Earnings"
                subtitle="What you made, order by order"
                onPress={go(ROUTES.DRIVER_EARNINGS)}
                style={activeRoute === ROUTES.DRIVER_EARNINGS ? styles.activeRow : undefined}
              />
              <ListRow
                icon="📄"
                title="My documents"
                subtitle="Licence, ID and vehicle"
                onPress={go(ROUTES.MY_DOCUMENTS)}
                style={activeRoute === ROUTES.MY_DOCUMENTS ? styles.activeRow : undefined}
              />
            </>
          ) : null}
          <ListRow
            icon="⚙️"
            title="Settings"
            onPress={go(ROUTES.SETTINGS)}
            style={activeRoute === ROUTES.SETTINGS ? styles.activeRow : undefined}
          />
          <ListRow icon="🚪" title="Log out" onPress={handleLogout} chevron={false} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Aiko · Minna, Niger State</Text>
        <Text style={styles.footerVersion}>v1.0.0</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingTop: 0 },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  headerText: { gap: 2 },
  name: type.heading,
  phone: type.bodySmall,
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.base,
  },
  items: { paddingVertical: spacing.sm },
  activeRow: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    marginHorizontal: spacing.sm,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  footerText: { ...type.caption, fontWeight: '600' },
  footerVersion: type.caption,
}));
