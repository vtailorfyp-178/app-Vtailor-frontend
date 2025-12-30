import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'customer' | 'tailor' | null;

type UserProfile = {
  name?: string;
  email?: string;
  address?: string;
  experience?: string;
  specialization?: string[];
  description?: string;
};

type AuthContextType = {
  acceptedTerms: boolean;
  acceptTerms: () => void;
  userPhone: string | null;
  userRole: UserRole;
  login: (phone: string, role: UserRole) => void;
  user?: UserProfile | null;
  updateProfile: (profile: UserProfile) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  const acceptTerms = () => setAcceptedTerms(true);

  const login = (phone: string, role: UserRole) => {
    setUserPhone(phone);
    setUserRole(role);
  };

  const updateProfile = (profile: UserProfile) => {
    setUser((prev) => ({ ...(prev || {}), ...profile }));
  };

  return (
    <AuthContext.Provider value={{ acceptedTerms, acceptTerms, userPhone, userRole, login, user, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
