import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import TailorChat from './chat';
import TailorHome from './home';
import TailorOrders from './orders';
import TailorProfile from './profile';
import TailorWallet from './wallet';

const TailorDashboard = () => {
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
      case 'home': return <TailorHome />;
      case 'orders': return <TailorOrders />;
      case 'chat': return <TailorChat />;
      case 'wallet': return <TailorWallet />;
      case 'profile': return <TailorProfile />;
      default: return <TailorHome />;
    }
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={{ flex: 1, paddingBottom: TAB_BAR_HEIGHT }}>
        {renderTab()}
        <BottomTabBar basePath="tailor" onTabChange={setActiveTab} activeTab={activeTab} />
      </View>
    </ProtectedRoute>
  );
};

export default TailorDashboard;
