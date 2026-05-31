import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomerChat from '@/components/CustomerChat';

export default function ChatPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const tailorId = typeof params.tailorId === 'string' ? params.tailorId : undefined;
  const tailorName = typeof params.tailorName === 'string' ? params.tailorName : undefined;
  const tailorPhone = typeof params.tailorPhone === 'string' ? params.tailorPhone : undefined;

  useEffect(() => {
    if (!tailorId) return;
    router.replace({
      pathname: '/customer/chat-conversation',
      params: {
        tailorId,
        otherUserId: tailorId,
        otherUserName: tailorName || 'Tailor',
        ...(tailorPhone ? { otherUserPhone: tailorPhone } : {}),
      },
    });
  }, [router, tailorId, tailorName, tailorPhone]);

  return <CustomerChat />;
}
