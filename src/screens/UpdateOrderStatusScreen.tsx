import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CheckCircle, Circle, Package, Navigation, Truck, Star } from 'lucide-react-native';
import { Button } from '../components/Button';
import { COLORS, SPACING } from '../theme';

const STATUS_STEPS = [
  { key: 'ACCEPTED', label: 'Order Accepted', icon: CheckCircle, desc: 'You have accepted this order' },
  { key: 'PICKED_UP', label: 'Picked Up', icon: Package, desc: 'Package collected from sender' },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: Truck, desc: 'On the way to destination' },
  { key: 'DELIVERED', label: 'Delivered', icon: Star, desc: 'Order successfully delivered' },
];

export const UpdateOrderStatusScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const order = route.params?.order || { id: 'ORD-8821' };

  const [currentStatus, setCurrentStatus] = useState('ACCEPTED');
  const [updating, setUpdating] = useState(false);

  const currentIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);
  const nextStep = STATUS_STEPS[currentIndex + 1];

  const handleUpdate = () => {
    if (!nextStep) return;
    setUpdating(true);
    setTimeout(() => {
      setCurrentStatus(nextStep.key);
      setUpdating(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Status</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order ID banner */}
        <View style={styles.orderBanner}>
          <Package size={24} color={COLORS.primary} />
          <View style={styles.orderBannerInfo}>
            <Text style={styles.orderBannerLabel}>Active Order</Text>
            <Text style={styles.orderBannerId}>{order.id}</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Status timeline */}
        <Text style={styles.sectionTitle}>Order Progress</Text>
        <View style={styles.timeline}>
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = STATUS_STEPS.findIndex(s => s.key === currentStatus) >= index;
            const isCurrent = step.key === currentStatus;
            const Icon = step.icon;

            return (
              <View key={step.key} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIcon,
                    isCompleted && styles.timelineIconDone,
                    isCurrent && styles.timelineIconCurrent,
                  ]}>
                    <Icon
                      size={18}
                      color={isCompleted ? COLORS.white : COLORS.border}
                    />
                  </View>
                  {index < STATUS_STEPS.length - 1 && (
                    <View style={[styles.timelineLine, isCompleted && styles.timelineLineDone]} />
                  )}
                </View>
                <View style={[styles.timelineContent, isCurrent && styles.timelineContentCurrent]}>
                  <Text style={[styles.timelineLabel, isCurrent && styles.timelineLabelCurrent]}>
                    {step.label}
                  </Text>
                  <Text style={styles.timelineDesc}>{step.desc}</Text>
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeTxt}>Current Status</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Next action */}
        {nextStep && (
          <View style={styles.nextCard}>
            <Text style={styles.nextTitle}>Next Step</Text>
            <Text style={styles.nextDesc}>
              Mark this order as <Text style={styles.nextHighlight}>{nextStep.label}</Text>?
            </Text>
          </View>
        )}

        {currentStatus === 'DELIVERED' && (
          <View style={styles.completeCard}>
            <CheckCircle size={48} color={COLORS.primary} />
            <Text style={styles.completeTitle}>Order Completed! 🎉</Text>
            <Text style={styles.completeSub}>Your earnings of ₦2,400 have been credited.</Text>
          </View>
        )}
      </ScrollView>

      {/* Action button */}
      <View style={styles.footer}>
        {nextStep ? (
          <Button
            title={`Mark as ${nextStep.label}`}
            onPress={handleUpdate}
            loading={updating}
            style={styles.actionBtn}
            icon={<Navigation size={20} color={COLORS.white} />}
            iconPosition="left"
          />
        ) : (
          <Button
            title="Go to Home"
            onPress={() => navigation.navigate('GoOnline')}
            style={styles.actionBtn}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.black },
  scroll: { padding: SPACING.xl },
  orderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  orderBannerInfo: { flex: 1 },
  orderBannerLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  orderBannerId: { fontSize: 18, fontWeight: '900', color: COLORS.black },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white },
  liveText: { fontSize: 12, fontWeight: '800', color: COLORS.white },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black, marginBottom: SPACING.lg },
  timeline: { marginBottom: SPACING.xl },
  timelineItem: { flexDirection: 'row', marginBottom: SPACING.sm },
  timelineLeft: { alignItems: 'center', width: 44, marginRight: SPACING.md },
  timelineIcon: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.border,
  },
  timelineIconDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timelineIconCurrent: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  timelineLineDone: { backgroundColor: COLORS.primary },
  timelineContent: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    minHeight: 64,
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  timelineContentCurrent: {
    backgroundColor: COLORS.primary + '08',
    borderColor: COLORS.primary + '40',
  },
  timelineLabel: { fontSize: 14, fontWeight: '800', color: COLORS.textMuted },
  timelineLabelCurrent: { color: COLORS.black },
  timelineDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },
  currentBadge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  currentBadgeTxt: { fontSize: 10, fontWeight: '800', color: COLORS.white },
  nextCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  nextTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  nextDesc: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  nextHighlight: { color: COLORS.primary, fontWeight: '900' },
  completeCard: {
    alignItems: 'center', padding: SPACING.xl,
    backgroundColor: COLORS.primary + '08',
    borderRadius: 28, borderWidth: 1.5, borderColor: COLORS.primary + '30',
    gap: SPACING.md, marginBottom: SPACING.lg,
  },
  completeTitle: { fontSize: 22, fontWeight: '900', color: COLORS.black },
  completeSub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },
  footer: { padding: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.white },
  actionBtn: { height: 56 },
});
