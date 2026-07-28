import type { Role } from '@/types/models';
import { createLogger } from '@/utils/logger';
import { useAppStore } from './appStore';
import { useBookingStore } from './bookingStore';

const log = createLogger('dev');

/**
 * Demo-only mutations, surfaced in the drawer's DevPanel.
 * These exist so a stakeholder walkthrough can jump between states without
 * re-running onboarding each time.
 */

/** Wipe persisted state and captured photos; the root navigator falls back to auth. */
export async function resetDemo(): Promise<void> {
  useBookingStore.getState().reset();
  await useAppStore.getState().resetDemo();
}

/**
 * Flip Passenger <-> Rider.
 *
 * A rider switched in this way keeps whatever documents they already captured.
 * If they have none, they land back in the document chain — which is the
 * correct behaviour, and lets one account demo both sides of the marketplace.
 */
export function switchRole(): Role {
  const state = useAppStore.getState();
  const next: Role = state.role === 'rider' ? 'passenger' : 'rider';

  useBookingStore.getState().reset();
  useAppStore.setState({
    role: next,
    // Passengers need no approval. Riders revert to whatever their document
    // state actually justifies, so the drawer shows the right dashboard.
    verificationStatus:
      next === 'passenger'
        ? 'approved'
        : state.documents.license && state.documents.nationalId && state.documents.plate
          ? state.verificationStatus === 'none'
            ? 'pending'
            : state.verificationStatus
          : 'none',
  });

  log.info('role switched to', next);
  return next;
}

/** Simulate an admin approving a rider's documents. */
export function approveRider(): void {
  useAppStore.getState().setVerificationStatus('approved');
  log.info('rider approved');
}

/** Send an approved rider back to the pending state. */
export function unapproveRider(): void {
  useAppStore.getState().setVerificationStatus('pending');
  log.info('rider set back to pending');
}
