import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Product } from './product';

export type TabParamList = {
  Home: undefined;
  Shop: { category?: string; query?: string } | undefined;
  Wishlist: undefined;
  Cart: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetails: { id: number; product?: Product };
};

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;
