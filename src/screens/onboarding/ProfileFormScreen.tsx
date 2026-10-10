import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { View } from 'react-native';

import {
  AppHeader,
  Button,
  DateField,
  PhoneInput,
  Screen,
  StepDots,
  TextField,
} from '@/components/ui';
import { UpdateOnboardingManager } from '@/modules/onboarding/onboardingController';
import { onboardingStepRoute, ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { ONBOARDING_TOTAL_STEPS } from '@/store/selectors';
import { latestDobForAge, parseIsoDate, toIsoDate } from '@/utils/date';
import { isValidNigerianPhone, toE164, toNationalNumber } from '@/utils/phone';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  typeof ROUTES.PROFILE_FORM
>;

interface Errors {
  email?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  phone?: string;
}

const MIN_AGE = 18;

/**
 * Held as a stable value rather than recomputed per render: it is the picker's
 * `maximumDate`, and a fresh object every render would remount the dialog's
 * bounds while the user is mid-scroll.
 */
const LATEST_ALLOWED_DOB = latestDobForAge(MIN_AGE);

export function ProfileFormScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const googleAccount = useAppStore((s) => s.googleAccount);
  const { updateOnboarding } = UpdateOnboardingManager();

  // Anything Google or a previous session gave us pre-fills the form; the
  // user can still edit it.
  const [firstName, setFirstName] = useState(
    user?.firstName ?? googleAccount?.givenName ?? ''
  );
  const [lastName, setLastName] = useState(
    user?.lastName ?? googleAccount?.familyName ?? ''
  );
  const [email, setEmail] = useState(user?.email ?? googleAccount?.email ?? '');
  const [dob, setDob] = useState<Date | null>(
    user?.dob ? parseIsoDate(user.dob) : null
  );
  // Google gives no phone number, so this screen is where every account
  // provides one — the onboarding stack's own PHONE step is commented out
  // for the same reason (see OnboardingStack). Unverified, same as before:
  // there is no SMS provider behind it yet.
  const [phone, setPhone] = useState(toNationalNumber(user?.phone ?? ''));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const validate = (): Errors => {
    const next: Errors = {};

    if (!firstName.trim()) next.firstName = 'Enter your first name.';
    if (!lastName.trim()) next.lastName = 'Enter your last name.';

    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "That doesn't look like a valid email.";

    if (!isValidNigerianPhone(phone)) next.phone = 'Enter a valid Nigerian mobile number.';

    // The picker can only ever hand back a real date on or before
    // LATEST_ALLOWED_DOB, so "did you pick one" is the only case left to check
    // here. The age check stays as a backstop for a value restored from the
    // store, which was written by some earlier version of this screen.
    if (!dob) {
      next.dob = 'Select your date of birth.';
    } else if (dob > LATEST_ALLOWED_DOB) {
      next.dob = `You must be at least ${MIN_AGE} to use Aiko.`;
    }

    return next;
  };

  const handleContinue = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0 || !dob) return;

    setSaving(true);
    try {
      const state = await updateOnboarding({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: toE164(phone),
        dob: toIsoDate(dob),
      });
      const next = onboardingStepRoute(state.resumeStep);
      if (next) navigation.navigate(next);
    } catch {
      // A duplicate email surfaces here as a 409 — useApiManager already
      // toasted it, and the form stays put so the user can pick another.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      scroll
      keyboardAvoiding
      footer={<Button label="Continue" onPress={handleContinue} testID="profile-continue" />}>
      <AppHeader
        title="Tell us about you"
        subtitle="This is how riders and passengers will recognise you, and your rider will use your number to reach you about a trip."
        trailing={<StepDots total={ONBOARDING_TOTAL_STEPS} current={0} />}
      />

      <View>
        <TextField
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          error={errors.firstName}
          placeholder="Amina"
          autoCapitalize="words"
          textContentType="givenName"
        />
        <TextField
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          error={errors.lastName}
          placeholder="Yakubu"
          autoCapitalize="words"
          textContentType="familyName"
        />
        <TextField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="amina@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
        />
        <PhoneInput
          value={phone}
          onChange={(next) => {
            setPhone(next);
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          error={errors.phone}
        />
        <DateField
          label="Date of birth"
          value={dob}
          onChange={(next) => {
            setDob(next);
            // Clear the error as soon as it stops being true, rather than
            // leaving it up until the next Continue press.
            setErrors((prev) => ({ ...prev, dob: undefined }));
          }}
          error={errors.dob}
          helper={`Tap to select. You must be ${MIN_AGE} or older.`}
          maximumDate={LATEST_ALLOWED_DOB}
          testID="profile-dob"
        />
      </View>
    </Screen>
  );
}
