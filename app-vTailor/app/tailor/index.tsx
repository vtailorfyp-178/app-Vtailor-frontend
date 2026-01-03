import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TailorHome from '@/components/TailorHome';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import TailorWallet from './wallet';

const TailorDashboard = () => {
  const params = useLocalSearchParams();
  const initialTab = typeof params?.tab === 'string' ? params.tab : 'home';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (typeof params?.tab === 'string') {
      setActiveTab(params.tab);
    }
  }, [params?.tab]);

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <TailorHome />;
      case 'wallet': return <TailorWallet />;
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
