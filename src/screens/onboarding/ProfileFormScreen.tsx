import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { View } from 'react-native';

import {
  AppHeader,
  Button,
  DateField,
  Screen,
  StepDots,
  TextField,
} from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { ONBOARDING_TOTAL_STEPS } from '@/store/selectors';
import { latestDobForAge, parseIsoDate, toIsoDate } from '@/utils/date';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  typeof ROUTES.PROFILE_FORM
>;

interface Errors {
  email?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
}

const MIN_AGE = 18;

/**
 * Held as a stable value rather than recomputed per render: it is the picker's
 * `maximumDate`, and a fresh object every render would remount the dialog's
 * bounds while the user is mid-scroll.
 */
const LATEST_ALLOWED_DOB = latestDobForAge(MIN_AGE);

export function ProfileFormScreen({ navigation }: Props) {
  const user = useAppStore((s) => s.user);
  const googleAccount = useAppStore((s) => s.googleAccount);
  const saveProfile = useAppStore((s) => s.saveProfile);

  // Anything Google gave us pre-fills the form; the user can still edit it.
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
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): Errors => {
    const next: Errors = {};

    if (!firstName.trim()) next.firstName = 'Enter your first name.';
    if (!lastName.trim()) next.lastName = 'Enter your last name.';

    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "That doesn't look like a valid email.";

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

  const handleContinue = () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0 || !dob) return;

    saveProfile({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob: toIsoDate(dob),
    });
    navigation.navigate(ROUTES.PROFILE_PHOTO);
  };

  return (
    <Screen
      scroll
      keyboardAvoiding
      footer={<Button label="Continue" onPress={handleContinue} testID="profile-continue" />}>
      <AppHeader
        title="Tell us about you"
        subtitle="This is how riders and passengers will recognise you."
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
