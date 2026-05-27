import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { items } = useCart();
  const { user } = useAuth();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const isAdmin = user?.role === 'admin';

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: isAdmin ? '#292524' : '#D97706',
          tabBarInactiveTintColor: '#A8A29E',
          tabBarStyle: {
            height: 65,
            paddingBottom: 12,
            paddingTop: 8,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E7E5E4',
            shadowColor: '#292524',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 8,
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';

            if (route.name === 'Início') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Carrinho') iconName = focused ? 'cart' : 'cart-outline';
            else if (route.name === 'Pedidos') iconName = focused ? 'receipt' : 'receipt-outline';
            else if (route.name === 'Gestão') iconName = focused ? 'briefcase' : 'briefcase-outline';
            else if (route.name === 'Produtos') iconName = focused ? 'fast-food' : 'fast-food-outline';
            else if (route.name === 'Usuários') iconName = focused ? 'people' : 'people-outline';
            else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        {isAdmin ? (
          <>
            <Tab.Screen name="Gestão" component={AdminOrdersScreen} />
            <Tab.Screen name="Produtos" component={AdminProductsScreen} />
            <Tab.Screen name="Usuários" component={AdminUsersScreen} />
            <Tab.Screen name="Perfil" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Tab.Screen name="Início" component={HomeScreen} />
            <Tab.Screen
              name="Carrinho"
              component={CartScreen}
              options={{
                tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
                tabBarBadgeStyle: { backgroundColor: '#EF4444' }
              }}
            />
            <Tab.Screen name="Pedidos" component={OrdersScreen} />
            <Tab.Screen name="Perfil" component={ProfileScreen} />
          </>
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
