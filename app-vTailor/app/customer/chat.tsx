import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CustomerChat from '@/components/CustomerChat';

export default function ChatPage() {
  const params = useLocalSearchParams();
  const tailorId = params.tailorId ? Number(params.tailorId) : undefined;
  const tailorName = typeof params.tailorName === 'string' ? params.tailorName : undefined;

  return <CustomerChat tailorId={tailorId} tailorName={tailorName} />;
}
