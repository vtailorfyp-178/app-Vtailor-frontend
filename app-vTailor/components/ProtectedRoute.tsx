import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'tailor';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const router = useRouter();
  const { isProfileCompleted, userRole } = useAuth();
  const [isChecking, setIsChecking] = React.useState(true);
  const tint = useThemeColor({}, 'tint');

  useEffect(() => {
    setIsChecking(false);
    
    if (!isProfileCompleted) {
      (router as any).replace('/profile-setup');
      return;
    }

    if (requiredRole && userRole !== requiredRole) {
      if (userRole === 'customer') {
        (router as any).replace('/customer');
      } else if (userRole === 'tailor') {
        (router as any).replace('/tailor');
      } else {
        (router as any).replace('/auth');
      }
    }
  }, [isProfileCompleted, userRole, requiredRole, router]);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  return <>{children}</>;
};
