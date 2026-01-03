import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import CustomerChat from '@/components/CustomerChat';
import CustomerHome from '@/components/CustomerHome';
import CustomerOrders from '@/components/CustomerOrders';
import CustomerProfile from '@/components/CustomerProfile';
import CustomerWallet from '@/components/CustomerWallet';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

const CustomerDashboard = () => {
  const params = useLocalSearchParams();
  const initialTab = typeof params?.tab === 'string' ? params.tab : 'home';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (typeof params?.tab === 'string') {
      setActiveTab(params.tab);
    }
  }, [params?.tab]);

  useFocusEffect(
    useCallback(() => {
      if (typeof params?.tab === 'string') {
        setActiveTab(params.tab);
      }
    }, [params?.tab])
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <CustomerHome />;
      case 'orders': return <CustomerOrders />;
      case 'chat': return <CustomerChat />;
      case 'wallet': return <CustomerWallet />;
      case 'profile': return <CustomerProfile />;
      default: return <CustomerHome />;
    }
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={{ flex: 1, paddingBottom: TAB_BAR_HEIGHT }}>
        {renderTab()}
        <BottomTabBar basePath="customer" onTabChange={setActiveTab} activeTab={activeTab} />
      </View>
    </ProtectedRoute>
  );
};

export default CustomerDashboard;
