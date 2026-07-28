import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { View } from 'react-native';

import { AppHeader, Button, Screen, StepDots, TextField } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { ONBOARDING_TOTAL_STEPS } from '@/store/selectors';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  typeof ROUTES.PROFILE_FORM
>;

interface Errors {
  email?: string;
  firstName?: string;
  lastName?: string;
  age?: string;
}

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
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): Errors => {
    const next: Errors = {};

    if (!firstName.trim()) next.firstName = 'Enter your first name.';
    if (!lastName.trim()) next.lastName = 'Enter your last name.';

    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "That doesn't look like a valid email.";

    const ageNum = Number(age);
    if (!age.trim()) next.age = 'Enter your age.';
    else if (!Number.isFinite(ageNum) || ageNum < 18)
      next.age = 'You must be at least 18 to use Aiko.';
    else if (ageNum > 100) next.age = 'Enter a valid age.';

    return next;
  };

  const handleContinue = () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    saveProfile({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: Number(age),
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
        <TextField
          label="Age"
          value={age}
          onChangeText={(t) => setAge(t.replace(/\D+/g, '').slice(0, 3))}
          error={errors.age}
          helper="You must be 18 or older."
          placeholder="24"
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>
    </Screen>
  );
}
