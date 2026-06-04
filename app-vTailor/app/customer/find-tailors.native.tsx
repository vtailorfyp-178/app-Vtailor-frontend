import FindTailorsNativeScreen from '@/components/FindTailorsNativeScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function FindTailorsRoute() {
  return (
    <ErrorBoundary title="Find Tailors could not load">
      <FindTailorsNativeScreen />
    </ErrorBoundary>
  );
}
