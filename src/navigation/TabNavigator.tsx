import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Heart, House, LayoutGrid, ShoppingCart, UserRound } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useCartItemCount } from '../store/cartStore';
import CartScreen from '../screens/CartScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductListingScreen from '../screens/ProductListingScreen';
import WishlistScreen from '../screens/WishlistScreen';
import AccountScreen from '../screens/AccountScreen';
import { colors } from '../theme/colors';
import type { TabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const cartCount = useCartItemCount();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // On web there is no safe-area inset, so give the icon and label room explicitly.
          ...(Platform.OS === 'web' ? { height: 72, paddingTop: 8, paddingBottom: 12 } : null),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.onPrimary },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <House size={size} color={color} strokeWidth={1.75} /> }}
      />
      <Tab.Screen
        name="Shop"
        component={ProductListingScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} strokeWidth={1.75} /> }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ tabBarIcon: ({ color, size }) => <Heart size={size} color={color} strokeWidth={1.75} /> }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} strokeWidth={1.75} /> }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : undefined,
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} strokeWidth={1.75} />,
        }}
      />
    </Tab.Navigator>
  );
}
