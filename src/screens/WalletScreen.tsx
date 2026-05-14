import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Gift, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme';

export const WalletScreen = () => {
  const transactions = [
    { id: '1', type: 'credit', amount: 5000, title: 'Top Up', date: 'Oct 24, 2023', status: 'Completed' },
    { id: '2', type: 'debit', amount: 1200, title: 'Ride Payment', date: 'Oct 23, 2023', status: 'Completed' },
    { id: '3', type: 'reward', amount: 50, title: 'Referral Bonus', date: 'Oct 22, 2023', status: 'Earned' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>₦24,500.00</Text>
          </View>
          <View style={styles.rewardSection}>
            <View style={styles.rewardBadge}>
              <Gift size={16} color={COLORS.primary} />
              <Text style={styles.rewardPoints}>1,240 Points</Text>
            </View>
            <Text style={styles.rewardLabel}>Reward Points</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <ArrowDownLeft size={24} color="#2E7D32" />
            </View>
            <Text style={styles.actionText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]}>
              <ArrowUpRight size={24} color="#C62828" />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <TrendingUp size={24} color="#1565C0" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((tx) => (
          <TouchableOpacity key={tx.id} style={styles.transactionItem}>
            <View style={[styles.txIconContainer, { backgroundColor: tx.type === 'credit' ? '#E8F5E9' : tx.type === 'debit' ? '#FFEBEE' : '#FFF8E1' }]}>
              {tx.type === 'credit' ? <ArrowDownLeft size={20} color="#2E7D32" /> : tx.type === 'debit' ? <ArrowUpRight size={20} color="#C62828" /> : <Gift size={20} color="#FFA000" />}
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <View style={styles.txAmountContainer}>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#2E7D32' : tx.type === 'debit' ? '#C62828' : '#FFA000' }]}>
                {tx.type === 'debit' ? '-' : '+'}{tx.type === 'reward' ? '' : '₦'}{tx.amount.toLocaleString()}
              </Text>
              <Text style={styles.txStatus}>{tx.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Rewards Promotion */}
        <TouchableOpacity style={styles.promoCard}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>Earn more points!</Text>
            <Text style={styles.promoSubtitle}>Refer a friend and get 500 reward points instantly.</Text>
          </View>
          <ChevronRight size={24} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  rewardSection: {
    alignItems: 'flex-end',
  },
  rewardBadge: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  rewardPoints: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  rewardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  transactionItem: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  txIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  txAmountContainer: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  txStatus: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  promoCard: {
    backgroundColor: COLORS.secondary || '#333',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  promoSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});
