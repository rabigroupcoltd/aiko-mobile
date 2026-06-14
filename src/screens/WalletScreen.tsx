import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Gift, ChevronRight, X } from 'lucide-react-native';
import { COLORS } from '../theme';
import { Button } from '../components/Button';

type Transaction = {
  id: string;
  type: 'credit' | 'debit' | 'reward';
  amount: number;
  title: string;
  date: string;
  status: string;
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'credit', amount: 5000, title: 'Top Up', date: 'Oct 24, 2023', status: 'Completed' },
  { id: '2', type: 'debit', amount: 1200, title: 'Ride Payment', date: 'Oct 23, 2023', status: 'Completed' },
  { id: '3', type: 'reward', amount: 50, title: 'Referral Bonus', date: 'Oct 22, 2023', status: 'Earned' },
];

const OLDER_TRANSACTIONS: Transaction[] = [
  { id: '4', type: 'debit', amount: 800, title: 'Ride Payment', date: 'Oct 20, 2023', status: 'Completed' },
  { id: '5', type: 'credit', amount: 10000, title: 'Top Up', date: 'Oct 18, 2023', status: 'Completed' },
  { id: '6', type: 'debit', amount: 1500, title: 'Ride Payment', date: 'Oct 15, 2023', status: 'Completed' },
];

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

const REFERRAL_CODE = 'RABI-2K4F9';

export const WalletScreen = () => {
  const [balance, setBalance] = useState(24500);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [showAll, setShowAll] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'withdraw' | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [modalError, setModalError] = useState('');

  const visibleTransactions = showAll ? [...transactions, ...OLDER_TRANSACTIONS] : transactions.slice(0, 3);

  const openModal = (type: 'add' | 'withdraw') => {
    setModalType(type);
    setAmountInput('');
    setModalError('');
  };

  const closeModal = () => {
    setModalType(null);
    setAmountInput('');
    setModalError('');
  };

  const handleConfirmAmount = (value: number) => {
    if (!value || value <= 0) {
      setModalError('Enter a valid amount');
      return;
    }
    if (modalType === 'withdraw' && value > balance) {
      setModalError('Insufficient balance');
      return;
    }

    const isAdd = modalType === 'add';
    setBalance((prev) => (isAdd ? prev + value : prev - value));
    setTransactions((prev) => [
      {
        id: Date.now().toString(),
        type: isAdd ? 'credit' : 'debit',
        amount: value,
        title: isAdd ? 'Wallet Top Up' : 'Withdrawal',
        date: 'Just now',
        status: 'Completed',
      },
      ...prev,
    ]);
    closeModal();
  };

  const handleRefer = () => {
    Alert.alert(
      'Refer & Earn',
      `Share your code ${REFERRAL_CODE} with friends. You both get 500 reward points when they complete their first ride!`
    );
  };

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
            <Text style={styles.balanceAmount}>
              ₦{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
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
          <TouchableOpacity style={styles.actionButton} onPress={() => openModal('add')}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <ArrowDownLeft size={24} color="#2E7D32" />
            </View>
            <Text style={styles.actionText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => openModal('withdraw')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]}>
              <ArrowUpRight size={24} color="#C62828" />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowAll((v) => !v)}>
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <TrendingUp size={24} color="#1565C0" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => setShowAll((v) => !v)}>
            <Text style={styles.seeAll}>{showAll ? 'Show Less' : 'See All'}</Text>
          </TouchableOpacity>
        </View>

        {visibleTransactions.map((tx) => (
          <View key={tx.id} style={styles.transactionItem}>
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
          </View>
        ))}

        {/* Rewards Promotion */}
        <TouchableOpacity style={styles.promoCard} onPress={handleRefer}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>Earn more points!</Text>
            <Text style={styles.promoSubtitle}>Refer a friend and get 500 reward points instantly.</Text>
          </View>
          <ChevronRight size={24} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Add Money / Withdraw Modal */}
      <Modal visible={modalType !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalType === 'add' ? 'Add Money' : 'Withdraw'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputWrapper}>
              <Text style={styles.amountCurrency}>₦</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="number-pad"
                value={amountInput}
                onChangeText={(v) => { setAmountInput(v.replace(/[^0-9]/g, '')); setModalError(''); }}
                autoFocus
              />
            </View>

            {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}

            <View style={styles.chipsRow}>
              {QUICK_AMOUNTS.map((amt) => (
                <TouchableOpacity key={amt} style={styles.chip} onPress={() => { setAmountInput(String(amt)); setModalError(''); }}>
                  <Text style={styles.chipText}>₦{amt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={modalType === 'add' ? 'Add to Wallet' : 'Withdraw Funds'}
              onPress={() => handleConfirmAmount(parseInt(amountInput || '0', 10))}
              style={styles.modalConfirmBtn}
            />
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  amountCurrency: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    height: 60,
  },
  modalErrorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalConfirmBtn: {
    height: 56,
    marginTop: 8,
  },
});
