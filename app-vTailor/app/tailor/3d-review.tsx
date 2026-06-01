import React, { useCallback, useState } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TailorOrderSummaryCard } from '@/components/TailorOrderSummaryCard';
import {
  TailorEmptyState,
  TailorInfoBanner,
  TailorScreenShell,
} from '@/components/tailor/TailorScreenShell';
import { TAILOR } from '@/components/tailor/tailorUi';
import {
  loadTailorOrdersWithDesigns,
  type TailorOrderRecord,
} from '@/services/tailor/tailorOrderCatalog';

export default function Tailor3DReview() {
  const router = useRouter();
  const [orders, setOrders] = useState<TailorOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadTailorOrdersWithDesigns();
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  const openOrder = (order: TailorOrderRecord) => {
    const c = order.customization;
    if (!c) return;
    router.push({
      pathname: '/tailor/3d-view',
      params: {
        orderId: order.orderId,
        customerId: order.customerId,
        customerName: order.customerName,
        modelId: c.modelId,
        modelName: c.modelName,
        selections: JSON.stringify(c.selections || {}),
        designId: c.designId ?? '',
      },
    });
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <TailorScreenShell
        title="3D Order Review"
        subtitle="Saved customer dress designs — tap to open live 3D preview"
        onBack={() => router.back()}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <TailorInfoBanner
            icon="cube-outline"
            text="Only real designs saved by customers in the app appear here."
          />

          {loading ? (
            <ActivityIndicator size="large" color={TAILOR.primary} style={{ marginTop: 32 }} />
          ) : orders.length === 0 ? (
            <TailorEmptyState
              icon="color-palette-outline"
              title="No 3D designs yet"
              message="When a customer finishes 3D customization and saves the design, it will show here."
            />
          ) : (
            orders.map((order) => (
              <TailorOrderSummaryCard
                key={order.orderId}
                order={order}
                badge="3D"
                badgeColor={TAILOR.soft}
                badgeTextColor={TAILOR.primaryDark}
                onPress={() => openOrder(order)}
              />
            ))
          )}
        </ScrollView>
      </TailorScreenShell>
    </ProtectedRoute>
  );
}
