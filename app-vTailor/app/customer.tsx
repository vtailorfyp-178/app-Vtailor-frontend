import React, { useState } from 'react';
import { View } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import BottomTabBar from '@/components/BottomTabBar';
import CustomerHome from '@/components/CustomerHome';
import CustomerOrders from '@/components/CustomerOrders';
import CustomerChat from '@/components/CustomerChat';
import CustomerWallet from '@/components/CustomerWallet';
import CustomerProfile from '@/components/CustomerProfile';

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');

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
        <BottomTabBar basePath="customer" onTabChange={setActiveTab} />
      </View>
    </ProtectedRoute>
  );
};

export default CustomerDashboard;
