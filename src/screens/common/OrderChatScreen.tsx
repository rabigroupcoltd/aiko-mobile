import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/ui';
import { useRideEvent } from '@/hooks/useRideSocket';
import {
  SendOrderMessageManager,
  useGetOrderMessagesManager,
} from '@/modules/orders/ordersController';
import type { RideMessage } from '@/modules/orders/ordersTypes';
import { useAuthStore } from '@/store/authStore';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import showToast from '@/utils/toast';

interface Props {
  /** Both stacks register this screen, so the route type differs per side. */
  navigation: { goBack: () => void };
  route: { params: { orderId: string; title?: string } };
}

/**
 * Chat for one order.
 *
 * Scoped to the order, not to the pair of people — §29 and §45. A driver
 * carrying three orders has three separate conversations, and a message about
 * one of them cannot leak into another. The server enforces the same thing:
 * only participants of that order may read or post, and the thread closes when
 * the order does.
 */
export function OrderChatScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { orderId, title } = route.params;

  const myUserId = useAuthStore((s) => s.user?.id);

  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<RideMessage>>(null);

  /**
   * Polled slowly. `new-message` pushes each message as it lands, so this only
   * has to cover a socket that dropped mid-conversation.
   */
  const { data: messages, refetch } = useGetOrderMessagesManager({
    id: orderId,
    refetchInterval: 20_000,
  });

  const { sendMessage, isLoading: sending } = SendOrderMessageManager();

  useRideEvent(
    'new-message',
    (payload: any) => {
      // The room is per order, but a driver holding several is joined to all of
      // them — so the id still has to be checked.
      if (payload?.orderId !== orderId) return;
      void refetch();
    },
    Boolean(orderId),
  );

  useEffect(() => {
    if (messages?.length) listRef.current?.scrollToEnd({ animated: true });
  }, [messages?.length]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending) return;

    // Cleared optimistically: leaving the text in place after a successful send
    // is the more common annoyance, and a failure puts it back.
    setDraft('');

    try {
      await sendMessage({ id: orderId, content });
      await refetch();
    } catch (e: any) {
      setDraft(content);
      showToast.error(e?.message ?? 'Could not send that message.');
    }
  }, [draft, sending, sendMessage, orderId, refetch]);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} hitSlop={10} accessibilityRole="button">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title ?? 'Order chat'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}>
        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Bubble message={item} mine={item.senderId === myUserId} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No messages yet. Say hello — your driver can see this.
            </Text>
          }
        />

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message"
            placeholderTextColor={colors.textDisabled}
            style={styles.input}
            multiline
            maxLength={2000}
            accessibilityLabel="Message"
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={({ pressed }) => [
              styles.send,
              (!draft.trim() || sending) && styles.sendDisabled,
              pressed && styles.sendPressed,
            ]}>
            <Text style={styles.sendGlyph}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ message, mine }: { message: RideMessage; mine: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.content}</Text>
        <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  back: { fontSize: 30, color: colors.text, lineHeight: 32 },
  title: { ...type.subheading, flex: 1 },

  list: { paddingVertical: spacing.base, gap: spacing.sm, flexGrow: 1 },
  empty: { ...type.caption, textAlign: 'center', marginTop: spacing.xxl },

  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.base, gap: 2 },
  bubbleTheirs: { backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { ...type.body, fontSize: 15 },
  bubbleTextMine: { color: colors.onPrimary },
  bubbleTime: { ...type.caption, fontSize: 10 },
  bubbleTimeMine: { color: colors.onPrimary, opacity: 0.8 },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  input: {
    flex: 1,
    ...type.body,
    maxHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendPressed: { opacity: 0.7 },
  sendGlyph: { fontSize: 18, color: colors.onPrimary },
}));
