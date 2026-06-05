import React, { useCallback, useState } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TailorOrderSummaryCard } from '@/components/TailorOrderSummaryCard';
import {
  TailorEmptyState,
  TailorInfoBanner,
  TailorScreenShell,
} from '@/components/tailor/TailorScreenShell';
import { TAILOR } from '@/components/tailor/tailorUi';
import {
  loadTailorOrdersWithMeasurements,
  type TailorOrderRecord,
} from '@/services/tailor/tailorOrderCatalog';

export default function TailorMeasurementsList() {
  const router = useRouter();
  const [orders, setOrders] = useState<TailorOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await loadTailorOrdersWithMeasurements());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <ProtectedRoute requiredRole="tailor">
      <TailorScreenShell
        title="Customer Measurements"
        subtitle="View measurements on the same 3D mannequin the customer used"
        onBack={() => router.back()}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <TailorInfoBanner
            icon="body-outline"
            text="Select an order to review body measurements with interactive 3D labels."
          />

          {loading ? (
            <ActivityIndicator size="large" color={TAILOR.primary} style={{ marginTop: 32 }} />
          ) : orders.length === 0 ? (
            <TailorEmptyState
              icon="resize-outline"
              title="No measurements yet"
              message="They appear when a customer completes the measurement form."
            />
          ) : (
            orders.map((order) => (
              <TailorOrderSummaryCard
                key={order.orderId}
                order={order}
                badge="Measure"
                badgeColor={TAILOR.successSoft}
                badgeTextColor={TAILOR.successText}
                onPress={() =>
                  router.push({
                    pathname: '/tailor/measurement-detail',
                    params: {
                      orderId: order.orderId,
                      designId: order.customization?.designId || '',
                      customerName: order.customerName,
                    },
                  })
                }
              />
            ))
          )}
        </ScrollView>
      </TailorScreenShell>
    </ProtectedRoute>
  );
}

