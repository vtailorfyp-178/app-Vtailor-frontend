import CustomerChat from '@/components/CustomerChat';
import CustomerHome from '@/components/CustomerHome';
import CustomerOrders from '@/components/CustomerOrders';
import CustomerProfile from '@/components/CustomerProfile';
import CustomerWallet from '@/components/CustomerWallet';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { customerTabFromParam } from '@/components/customer/customerTabConfig';
import { SURFACE_MUTED } from '@/constants/ui';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

const CustomerDashboard = () => {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    customerTabFromParam(typeof params?.tab === 'string' ? params.tab : undefined),
  );

  useFocusEffect(
    useCallback(() => {
      setActiveTab(customerTabFromParam(typeof params?.tab === 'string' ? params.tab : undefined));
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
      <View style={{ flex: 1, backgroundColor: SURFACE_MUTED }}>
        {renderTab()}
      </View>
    </ProtectedRoute>
  );
};

export default CustomerDashboard;
