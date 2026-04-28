import CustomerChat from '@/components/CustomerChat';
import CustomerHome from '@/components/CustomerHome';
import CustomerOrders from '@/components/CustomerOrders';
import CustomerProfile from '@/components/CustomerProfile';
import CustomerWallet from '@/components/CustomerWallet';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

const CustomerDashboard = () => {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    typeof params?.tab === 'string' ? params.tab : 'home'
  );

  useFocusEffect(
    useCallback(() => {
      const tabFromParams = typeof params?.tab === 'string' ? params.tab : 'home';
      setActiveTab(tabFromParams);
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
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>
    </ProtectedRoute>
  );
};

export default CustomerDashboard;
