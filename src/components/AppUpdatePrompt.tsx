import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AikoMark } from '@/components/brand/AikoMark';
import { Button } from '@/components/ui';
import {
  checkPlay,
  decideUpdate,
  offeredRecently,
  openStore,
  rememberOffer,
  startPlayUpdate,
} from '@/services/appUpdate';
import { makeStyles, spacing } from '@/theme';

/** Re-check when the app returns to the foreground, but not more often than this. */
const RECHECK_MS = 30 * 60 * 1000;

/**
 * Keeps the app current through Google Play's in-app updates. When Play has a
 * newer release, its update screen is offered at most once a day. A release
 * published with high priority covers the app until it is installed.
 * Renders nothing otherwise.
 */
export function AppUpdatePrompt() {
  const styles = useStyles();
  const [required, setRequired] = useState(false);
  const [starting, setStarting] = useState(false);
  const lastCheckRef = useRef(0);

  const check = useCallback(async () => {
    if (__DEV__) return;
    lastCheckRef.current = Date.now();

    const action = decideUpdate(await checkPlay());

    switch (action.kind) {
      case 'require':
        setRequired(true);
        void startPlayUpdate();
        return;
      case 'resume':
        setRequired(false);
        void startPlayUpdate();
        return;
      case 'offer':
        setRequired(false);
        if (await offeredRecently(action.storeVersion)) return;
        await rememberOffer(action.storeVersion);
        void startPlayUpdate();
        return;
      default:
        setRequired(false);
    }
  }, []);

  useEffect(() => {
    void check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && Date.now() - lastCheckRef.current > RECHECK_MS) void check();
    });
    return () => sub.remove();
  }, [check]);

  if (!required) return null;

  const update = async () => {
    setStarting(true);
    try {
      if (!(await startPlayUpdate())) await openStore();
    } finally {
      setStarting(false);
    }
  };

  // Shown behind Play's update screen, so backing out of it doesn't skip a
  // required update. It can't be dismissed.
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={() => undefined}>
      <SafeAreaView style={styles.container}>
        <View style={styles.body}>
          <AikoMark size={96} variant="glyph" />
          <Text style={styles.title}>Time to update Aiko</Text>
          <Text style={styles.text}>
            This version is no longer supported. Update from Google Play to keep booking and
            riding — it only takes a minute.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button label="Update now" onPress={() => void update()} loading={starting} />
          <Text style={styles.hint}>Updating keeps your account, orders and earnings.</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title: { ...type.title, textAlign: 'center', marginTop: spacing.base },
  text: { ...type.body, textAlign: 'center', color: colors.textSecondary, maxWidth: 340 },
  actions: { gap: spacing.sm },
  hint: { ...type.caption, textAlign: 'center' },
}));
