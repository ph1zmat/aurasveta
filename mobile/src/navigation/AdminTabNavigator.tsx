import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { DashboardScreen } from '../screens/DashboardScreen'
import { ProductsScreen } from '../screens/ProductsScreen'
import { ProductFormScreen } from '../screens/ProductFormScreen'
import { OrdersScreen } from '../screens/OrdersScreen'
import { OrderDetailScreen } from '../screens/OrderDetailScreen'
import { CategoriesScreen } from '../screens/CategoriesScreen'
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen'
import { CategoryFormScreen } from '../screens/CategoryFormScreen'
import { MoreScreen } from '../screens/MoreScreen'
import { PropertiesScreen } from '../screens/PropertiesScreen'
import { PagesScreen } from '../screens/PagesScreen'
import { PageFormScreen } from '../screens/PageFormScreen'
import { SeoScreen } from '../screens/SeoScreen'
import { WebhooksScreen } from '../screens/WebhooksScreen'
import { ImportExportScreen } from '../screens/ImportExportScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { colors } from '../theme'
import { LayoutDashboard, Package, ShoppingCart, FolderOpen, Menu } from 'lucide-react-native'
import type { ProductsStackParamList, OrdersStackParamList, CategoriesStackParamList, MoreStackParamList } from './types'

const Tab = createBottomTabNavigator()

const screenOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.foreground,
  headerTitleStyle: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 1 },
}

// --- Products Stack ---
const ProductsStack = createNativeStackNavigator<ProductsStackParamList>()
function ProductsStackScreen() {
  return (
    <ProductsStack.Navigator screenOptions={screenOptions}>
      <ProductsStack.Screen name="ProductsList" component={ProductsScreen} options={{ title: 'ТОВАРЫ' }} />
      <ProductsStack.Screen name="ProductForm" component={ProductFormScreen} options={({ route }) => ({ title: route.params?.id ? 'РЕДАКТИРОВАНИЕ' : 'НОВЫЙ ТОВАР' })} />
    </ProductsStack.Navigator>
  )
}

// --- Orders Stack ---
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>()
function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator screenOptions={screenOptions}>
      <OrdersStack.Screen name="OrdersList" component={OrdersScreen} options={{ title: 'ЗАКАЗЫ' }} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'ЗАКАЗ' }} />
    </OrdersStack.Navigator>
  )
}

// --- Categories Stack ---
const CategoriesStack = createNativeStackNavigator<CategoriesStackParamList>()
function CategoriesStackScreen() {
  return (
    <CategoriesStack.Navigator screenOptions={screenOptions}>
      <CategoriesStack.Screen name="CategoriesList" component={CategoriesScreen} options={{ title: 'КАТЕГОРИИ' }} />
      <CategoriesStack.Screen name="CategoryDetail" component={CategoryDetailScreen} options={{ title: 'КАТЕГОРИЯ' }} />
      <CategoriesStack.Screen name="CategoryForm" component={CategoryFormScreen} options={({ route }) => ({ title: route.params?.id ? 'РЕДАКТИРОВАНИЕ' : 'НОВАЯ КАТЕГОРИЯ' })} />
    </CategoriesStack.Navigator>
  )
}

// --- More Stack ---
const MoreStack = createNativeStackNavigator<MoreStackParamList>()
function MoreStackScreen() {
  return (
    <MoreStack.Navigator screenOptions={screenOptions}>
      <MoreStack.Screen name="MoreMenu" component={MoreScreen} options={{ title: 'ЕЩЁ' }} />
      <MoreStack.Screen name="Properties" component={PropertiesScreen} options={{ title: 'СВОЙСТВА' }} />
      <MoreStack.Screen name="Pages" component={PagesScreen} options={{ title: 'СТРАНИЦЫ' }} />
      <MoreStack.Screen name="PageForm" component={PageFormScreen} options={({ route }) => ({ title: route.params?.id ? 'РЕДАКТИРОВАНИЕ' : 'НОВАЯ СТРАНИЦА' })} />
      <MoreStack.Screen name="Seo" component={SeoScreen} options={{ title: 'SEO' }} />
      <MoreStack.Screen name="Webhooks" component={WebhooksScreen} options={{ title: 'ВЕБХУКИ' }} />
      <MoreStack.Screen name="ImportExport" component={ImportExportScreen} options={{ title: 'ИМПОРТ / ЭКСПОРТ' }} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'НАСТРОЙКИ' }} />
    </MoreStack.Navigator>
  )
}

export function AdminTabNavigator() {
  usePushNotifications()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: 2, height: 56 },
      }}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'Главная', headerShown: true, headerTitle: 'ДАШБОРД', headerStyle: { backgroundColor: colors.card }, headerTitleStyle: { fontSize: 16, fontWeight: '600', letterSpacing: 1 }, tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} /> }} />
      <Tab.Screen name="ProductsTab" component={ProductsStackScreen} options={{ title: 'Товары', tabBarIcon: ({ color, size }) => <Package size={size} color={color} /> }} />
      <Tab.Screen name="OrdersTab" component={OrdersStackScreen} options={{ title: 'Заказы', tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} /> }} />
      <Tab.Screen name="CategoriesTab" component={CategoriesStackScreen} options={{ title: 'Категории', tabBarIcon: ({ color, size }) => <FolderOpen size={size} color={color} /> }} />
      <Tab.Screen name="MoreTab" component={MoreStackScreen} options={{ title: 'Ещё', tabBarIcon: ({ color, size }) => <Menu size={size} color={color} /> }} />
    </Tab.Navigator>
  )
}
