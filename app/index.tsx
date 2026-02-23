import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useStorage } from '../src/hooks/useStorage';
import { colors } from '../src/theme/colors';

export default function Index() {
  const router = useRouter();
  const { profile, isLoading } = useStorage();

  useEffect(() => {
    if (!isLoading) {
      if (profile.hasCompletedOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, profile.hasCompletedOnboarding]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.orange500} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
