import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, MessageCircle, Phone, Mail } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { useNavigation } from '@react-navigation/native';

const FAQS = [
  {
    id: 'book',
    question: 'How do I book a ride?',
    answer: "Tap \"Where are you going?\" on the home map, choose your destination, pick a ride type, and confirm to be matched with a nearby driver.",
  },
  {
    id: 'pay',
    question: 'How do I pay for my ride?',
    answer: 'Fares are charged to the default payment method shown during checkout. You can manage and top up your balance from the Wallet tab.',
  },
  {
    id: 'wallet',
    question: 'How do I add money to my wallet?',
    answer: 'Open the Wallet tab and tap "Add Money". Choose a quick amount or enter a custom value, then confirm to top up your balance.',
  },
  {
    id: 'driver',
    question: 'How do I become a driver?',
    answer: 'From the welcome screen, choose "Drive with us" and complete the document verification steps. Your account will be reviewed within 24-48 hours.',
  },
  {
    id: 'cancel',
    question: 'What happens if my driver cancels?',
    answer: "If a driver cancels, we'll automatically start looking for another nearby driver and you won't be charged for the cancelled trip.",
  },
];

export const HelpCenterScreen = () => {
  const navigation = useNavigation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleContact = () => {
    Alert.alert(
      'Contact Support',
      'Email: support@rabi.app\nPhone: +234 800 123 4567\n\nOur team is available 24/7 to help with your account, rides, and payments.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>How can we help you today?</Text>
        <Text style={styles.subheading}>Browse frequently asked questions or reach out to our team.</Text>

        <View style={styles.faqList}>
          {FAQS.map((faq) => {
            const expanded = expandedId === faq.id;
            return (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <ChevronDown
                    size={20}
                    color={COLORS.textMuted}
                    style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
                  />
                </View>
                {expanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.contactCard}>
          <MessageCircle size={32} color={COLORS.primary} />
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>Our support team is available around the clock.</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Phone size={18} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
          <View style={styles.contactRow}>
            <Mail size={14} color={COLORS.textMuted} />
            <Text style={styles.contactEmail}>support@rabi.app</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.xl,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  faqList: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  faqItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  contactCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  contactSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 18,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
  },
  contactEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
