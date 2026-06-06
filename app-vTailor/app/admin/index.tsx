import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminTabFromParam } from '@/components/admin/adminTabConfig';
import AdminHome from '@/components/admin/AdminHome';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminProfile from '@/components/admin/AdminProfile';
import AdminUsers from '@/components/admin/AdminUsers';
import { SURFACE_MUTED } from '@/constants/ui';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

const AdminDashboard = () => {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    adminTabFromParam(typeof params?.tab === 'string' ? params.tab : undefined),
  );

  useFocusEffect(
    useCallback(() => {
      setActiveTab(adminTabFromParam(typeof params?.tab === 'string' ? params.tab : undefined));
    }, [params?.tab]),
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <AdminHome />;
      case 'users':
        return <AdminUsers />;
      case 'orders':
        return <AdminOrders />;
      case 'profile':
        return <AdminProfile />;
      default:
        return <AdminHome />;
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <View style={{ flex: 1, backgroundColor: SURFACE_MUTED }}>{renderTab()}</View>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
