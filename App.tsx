
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import { LoadingState } from './src/components/LoadingState';
import { useStoresHydrated } from './src/hooks/useStoresHydrated';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';
import { useAuthStore } from './src/features/auth/authStore';

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: 'transparent',
    card: 'transparent',
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  const hydrated = useStoresHydrated();
  const authInitialized = useAuthStore((state) => state.initialized);
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      {hydrated && authInitialized ? (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.splash}>
            <LoadingState message="Restoring your account" />
          </View>
        </LinearGradient>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
