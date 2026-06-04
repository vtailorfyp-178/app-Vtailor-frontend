import { ProtectedRoute } from '@/components/ProtectedRoute';
import { tailorTabFromParam } from '@/components/tailor/tailorTabConfig';
import { SURFACE_MUTED } from '@/constants/ui';
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
    tailorTabFromParam(typeof params?.tab === 'string' ? params.tab : undefined),
  );

  useFocusEffect(
    useCallback(() => {
      setActiveTab(tailorTabFromParam(typeof params?.tab === 'string' ? params.tab : undefined));
    }, [params?.tab]),
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
      <View style={{ flex: 1, backgroundColor: SURFACE_MUTED }}>
        {renderTab()}
      </View>
    </ProtectedRoute>
  );
};

export default TailorDashboard;
