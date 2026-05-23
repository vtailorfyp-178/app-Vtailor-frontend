import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomerChat from '@/components/CustomerChat';

export default function ChatPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const tailorId = typeof params.tailorId === 'string' ? params.tailorId : undefined;
  const tailorName = typeof params.tailorName === 'string' ? params.tailorName : undefined;

  useEffect(() => {
    if (!tailorId) return;
    router.replace({
      pathname: '/customer/chat-conversation',
      params: {
        tailorId,
        otherUserId: tailorId,
        otherUserName: tailorName || 'Tailor',
      },
    });
  }, [router, tailorId, tailorName]);

  return <CustomerChat />;
}
