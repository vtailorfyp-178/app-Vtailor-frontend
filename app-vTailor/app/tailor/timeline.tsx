import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TailorOrderSummaryCard } from '@/components/TailorOrderSummaryCard';
import { TailorInfoBanner, TailorScreenShell } from '@/components/tailor/TailorScreenShell';
import { TAILOR } from '@/components/tailor/tailorUi';
import { loadAllTailorOrders, type TailorOrderRecord } from '@/services/tailor/tailorOrderCatalog';

export default function TailorTimelineList() {
  const router = useRouter();
  const [orders, setOrders] = useState<TailorOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await loadAllTailorOrders());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ProtectedRoute requiredRole="tailor">
      <TailorScreenShell
        title="Stitching Timeline"
        subtitle="Track and update each order's stitching progress"
        onBack={() => router.back()}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <TailorInfoBanner
            icon="time-outline"
            text="Open an order to view the 7-step stitching timeline and mark progress."
          />

          {loading ? (
            <ActivityIndicator size="large" color={TAILOR.primary} style={{ marginTop: 32 }} />
          ) : (
            orders.map((order) => (
              <TailorOrderSummaryCard
                key={order.orderId}
                order={order}
                badge={order.status}
                onPress={() =>
                  router.push({
                    pathname: '/tailor/timeline-detail',
                    params: { orderId: order.orderId },
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
