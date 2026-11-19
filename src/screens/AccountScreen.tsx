
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  ChevronRight,
  Clock3,
  LogOut,
  Package,
  UserRound,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase, isSupabaseConfigured } from '../api/supabase';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { useAuthStore } from '../features/auth/authStore';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Order = {
  id: string;
  total_amount: number;
  status: string;
  item_count: number;
  created_at: string;
};

export default function AccountScreen() {
  const {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signInGoogle,
    signOut,
    updateProfile,
    uploadAvatar,
    refreshProfile,
  } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id,total_amount,status,item_count,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    setOrders((data || []) as Order[]);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      return;
    }

    let active = true;
    setOrdersLoading(true);

    fetchOrders()
      .catch((e) => {
        if (active) console.error('Order fetch failed:', e);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id, fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([refreshProfile(), fetchOrders()]);
    } catch (e) {
      Alert.alert(
        'Refresh failed',
        e instanceof Error
          ? e.message
          : 'Could not refresh your account. Please try again.',
      );
    } finally {
      setRefreshing(false);
    }
  };

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);

    try {
      await fn();
    } catch (e) {
      Alert.alert(
        'FreshCart',
        e instanceof Error ? e.message : 'Something went wrong.',
      );
    } finally {
      setBusy(false);
    }
  };

  const chooseAvatar = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo library access to choose a profile picture.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (!result.canceled && result.assets[0]) {
      await run(() => uploadAvatar(result.assets[0].uri));
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.center}>
            <UserRound color={colors.primary} size={36} />
            <Text style={styles.heading}>Account setup required</Text>
            <Text style={styles.muted}>
              Add EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file,
              then restart Expo.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.authWrap}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.brand}>FreshCart</Text>

              <Text style={styles.heading}>
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </Text>

              <Text style={styles.muted}>
                Sign in to keep your shopping organised.
              </Text>

              {mode === 'signup' && (
                <Field
                  placeholder="Full name"
                  value={name}
                  onChangeText={setName}
                />
              )}

              <Field
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Field
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {mode === 'signup' && (
                <Field
                  placeholder="Confirm password"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                />
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                label={
                  loading || busy
                    ? 'Please wait…'
                    : mode === 'signin'
                      ? 'Sign in'
                      : 'Create account'
                }
                onPress={() =>
                  run(async () => {
                    if (!email.trim() || !password) {
                      throw new Error('Enter your email and password.');
                    }

                    if (mode === 'signup') {
                      if (password.length < 8) {
                        throw new Error(
                          'Use at least 8 characters for your password.',
                        );
                      }

                      if (password !== confirm) {
                        throw new Error('Passwords do not match.');
                      }

                      const active = await signUp(name, email, password);

                      if (!active) {
                        Alert.alert(
                          'Verify your email',
                          'Check your inbox to confirm your account before signing in.',
                        );
                      }
                    } else {
                      await signIn(email, password);
                    }
                  })
                }
              />

              <Button
                label="Continue with Google"
                variant="secondary"
                onPress={() => run(signInGoogle)}
              />

              <Pressable
                onPress={() =>
                  setMode(mode === 'signin' ? 'signup' : 'signin')
                }
              >
                <Text style={styles.switch}>
                  {mode === 'signin'
                    ? 'New to FreshCart? Create an account'
                    : 'Already have an account? Sign in'}
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Text style={styles.title}>Account</Text>

          <View style={styles.profileCard}>
            <Pressable onPress={chooseAvatar} style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <UserRound color={colors.primary} size={34} />
              )}

              <View style={styles.camera}>
                <Camera color="#fff" size={13} />
              </View>
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {profile?.full_name || user.email}
              </Text>
              <Text style={styles.muted}>{user.email}</Text>
              <Text style={styles.caption}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setEditName(profile?.full_name || '');
                setEditPhone(profile?.phone_number || '');
                setEditing(!editing);
              }}
            >
              <Text style={styles.link}>{editing ? 'Cancel' : 'Edit'}</Text>
            </Pressable>
          </View>

          {editing && (
            <View style={styles.panel}>
              <Field
                placeholder="Full name"
                value={editName}
                onChangeText={setEditName}
              />

              <Field
                placeholder="Phone number (optional)"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <Button
                label="Save profile"
                onPress={() =>
                  run(async () => {
                    await updateProfile({
                      full_name: editName.trim(),
                      phone_number: editPhone.trim() || null,
                    });

                    setEditing(false);
                  })
                }
              />
            </View>
          )}

          <Text style={styles.section}>My activity</Text>

          <View style={styles.panel}>
            <View style={styles.row}>
              <Package color={colors.primary} />
              <Text style={styles.rowTitle}>Shopping history</Text>
              <Text style={styles.count}>{orders.length} orders</Text>
            </View>

            {ordersLoading ? (
              <LoadingState message="Loading orders" />
            ) : orders.length === 0 ? (
              <Text style={styles.muted}>
                Your completed demo orders will appear here.
              </Text>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={styles.order}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      Order #{order.id.slice(0, 8)}
                    </Text>
                    <Text style={styles.caption}>
                      {new Date(order.created_at).toLocaleString()}
                      {' · '}
                      {order.item_count} items
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.rowTitle}>
                      ${Number(order.total_amount).toFixed(2)}
                    </Text>
                    <Text style={styles.caption}>{order.status}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <Text style={styles.section}>Account settings</Text>

          <View style={styles.panel}>
            <Pressable style={styles.menu} onPress={chooseAvatar}>
              <Camera color={colors.textMuted} />
              <Text style={styles.rowTitle}>Change profile picture</Text>
              <ChevronRight color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={styles.menu}
              onPress={() =>
                Alert.alert(
                  'Password reset',
                  'Send a password reset email?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Send',
                      onPress: () =>
                        run(async () => {
                          const { error } =
                            await supabase.auth.resetPasswordForEmail(
                              user.email || '',
                            );

                          if (error) throw error;

                          Alert.alert(
                            'Email sent',
                            'Check your inbox for the reset link.',
                          );
                        }),
                    },
                  ],
                )
              }
            >
              <Clock3 color={colors.textMuted} />
              <Text style={styles.rowTitle}>Change password</Text>
              <ChevronRight color={colors.textMuted} />
            </Pressable>
          </View>

          <Button
            label={busy ? 'Please wait…' : 'Log out'}
            variant="secondary"
            icon={LogOut}
            onPress={() => run(signOut)}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Field(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textMuted}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 40,
  },

  authWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },

  brand: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 28,
  },

  title: {
    ...typography.title,
    color: colors.text,
  },

  heading: {
    ...typography.heading,
    color: colors.text,
  },

  muted: {
    ...typography.body,
    color: colors.textMuted,
  },

  caption: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 3,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },

  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  camera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.primary,
    padding: 5,
    borderRadius: 12,
  },

  name: {
    ...typography.bodyStrong,
    color: colors.text,
  },

  link: {
    ...typography.bodyStrong,
    color: colors.primary,
  },

  section: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },

  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  rowTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },

  count: {
    ...typography.caption,
    color: colors.textMuted,
  },

  order: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },

  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    backgroundColor: colors.surface,
    ...typography.body,
  },

  error: {
    color: colors.danger,
    ...typography.caption,
  },

  switch: {
    color: colors.primary,
    textAlign: 'center',
    ...typography.bodyStrong,
  },
});
