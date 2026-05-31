import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '@/services/authApi';
import { connectStreamUser, disconnectStreamUser } from '@/services/streamChatService';

export type UserRole = 'customer' | 'tailor' | null;

export type UserProfile = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  experience?: string;
  specialization?: string[];
  description?: string;
  avatar?: string;
};

type AuthContextType = {
  acceptedTerms: boolean;
  acceptTerms: () => void;
  /** JWT access token */
  token: string | null;
  /** backward-compat alias */
  authToken: string | null;
  userId: string | null;
  userPhone: string | null;       // backward-compat alias for token
  userRole: UserRole;
  /** backward-compat alias */
  role: UserRole;
  loginEmail: string | null;      // the email address used at OTP login — auto-fills forms
  /** Call after OTP verify. email comes from the /otp/verify response. */
  login: (token: string, role: UserRole, email?: string, userId?: string) => void;
  /** Customer profile (only populated when userRole === 'customer') */
  customerProfile: UserProfile | null;
  /** Tailor profile (only populated when userRole === 'tailor') */
  tailorProfile: UserProfile | null;
  /** Convenience: whichever profile belongs to the current role */
  user: UserProfile | null;
  /** Persists profile under the key for the current user + role */
  updateProfile: (profile: UserProfile, roleOverride?: UserRole, userIdOverride?: string | null) => void;
  isProfileCompleted: boolean;
  isAuthLoading: boolean;
  markProfileCompleted: (roleOverride?: UserRole, userIdOverride?: string | null) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AsyncStorage key helpers — one set of keys per role so data never mixes
const profileKey = (role: UserRole, id?: string | null) => id ? `profile_${role}_${id}` : `profile_${role}`;
const completedKey = (role: UserRole, id?: string | null) => id ? `profileCompleted_${role}_${id}` : `profileCompleted_${role}`;

// User-specific storage keys (keyed by userId to support multiple accounts on one device)
const userCustomizationsKey = (userId: string) => `customizations_${userId}`;
const userMeasurementsKey = (userId: string) => `measurements_${userId}`;
const userOrdersKey = (userId: string) => `orders_${userId}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [acceptedTerms, setAcceptedTerms]       = useState(false);
  const [token, setToken]                       = useState<string | null>(null);
  const [userId, setUserId]                     = useState<string | null>(null);
  const [userRole, setUserRole]                 = useState<UserRole>(null);
  const [loginEmail, setLoginEmail]             = useState<string | null>(null);
  const [customerProfile, setCustomerProfile]   = useState<UserProfile | null>(null);
  const [tailorProfile, setTailorProfile]       = useState<UserProfile | null>(null);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [isAuthLoading, setIsAuthLoading]       = useState(true);

  // Restore auth session from storage on startup (web reload + app restart)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedRole, storedEmail] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('userRole'),
          AsyncStorage.getItem('loginEmail'),
        ]);
        const storedUserId = await AsyncStorage.getItem('userId');

        const role = (storedRole as UserRole) || null;

        if (storedToken) setToken(storedToken);
        if (storedUserId) setUserId(storedUserId);
        if (role)        setUserRole(role);
        if (storedEmail) setLoginEmail(storedEmail);

        // Load the role-specific profile and completion flag
        if (role) {
          const [storedProfile, completed] = await Promise.all([
            AsyncStorage.getItem(profileKey(role, storedUserId)).then((value) => value ?? AsyncStorage.getItem(profileKey(role))),
            AsyncStorage.getItem(completedKey(role, storedUserId)).then((value) => value ?? AsyncStorage.getItem(completedKey(role))),
          ]);
          if (storedProfile) {
            const parsed = JSON.parse(storedProfile) as UserProfile;
            role === 'customer' ? setCustomerProfile(parsed) : setTailorProfile(parsed);
          }
          if (completed === 'true') setIsProfileCompleted(true);
        }

        if (storedToken) {
          try {
            const remoteProfile = await getProfile(storedToken);
            const rid = remoteProfile.user_id;
            if (rid) setUserId(rid);
            const remail = remoteProfile.email;
            if (remail) setLoginEmail(remail);
            const profileRole = (remoteProfile.role as UserRole) || role;
            if (profileRole) {
              const profile: UserProfile = {
                name: remoteProfile.name ?? undefined,
                email: remoteProfile.email ?? undefined,
                phone: remoteProfile.phone ?? undefined,
                address: remoteProfile.address ?? undefined,
                experience: remoteProfile.experience ?? undefined,
                specialization: remoteProfile.specialization ?? undefined,
                description: remoteProfile.description ?? undefined,
                avatar: remoteProfile.avatar ?? undefined,
              };
              profileRole === 'customer' ? setCustomerProfile(profile) : setTailorProfile(profile);
              await AsyncStorage.setItem(profileKey(profileRole, rid || storedUserId), JSON.stringify(profile));
              if (remoteProfile.name || remoteProfile.address || remoteProfile.phone) {
                setIsProfileCompleted(true);
                await AsyncStorage.setItem(completedKey(profileRole, rid || storedUserId), 'true');
              }
            }
            // Connect Stream Chat after session restore
            const streamUserId = rid || storedUserId;
            if (streamUserId) {
              const displayName = remoteProfile.name || remail || streamUserId;
              connectStreamUser(
                storedToken,
                streamUserId,
                displayName,
                profileRole ?? undefined,
                remoteProfile.phone ?? undefined,
                remail ?? undefined
              ).catch((e) => console.warn('[Stream] session-restore connect failed:', e));
            }
          } catch (error) {
            console.error('Failed to hydrate profile from backend:', error);
          }
        }
      } catch (error) {
        console.error('Error restoring auth session:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    restoreSession();
  }, []);

  const acceptTerms = () => setAcceptedTerms(true);

  const login = (newToken: string, role: UserRole, email?: string, newUserId?: string) => {
    setToken(newToken);
    if (newUserId) setUserId(newUserId);
    setUserRole(role);
    // Don't reset completion here — let the auth.tsx flow determine if profile-setup is needed
    // based on whether the profile exists on the backend.
    if (email) {
      setLoginEmail(email);
      // Pre-seed the email field in whichever profile slot this role uses
      const seed: UserProfile = { email };
      role === 'customer' ? setCustomerProfile(seed) : setTailorProfile(seed);
      if (role) {
        AsyncStorage.setItem(profileKey(role, newUserId), JSON.stringify(seed)).catch(() => {});
      }
    }
    AsyncStorage.setItem('authToken', newToken).catch(() => {});
    AsyncStorage.setItem('userRole', role ?? '').catch(() => {});
    if (newUserId) AsyncStorage.setItem('userId', newUserId).catch(() => {});
    if (email) AsyncStorage.setItem('loginEmail', email).catch(() => {});

    // Connect Stream Chat
    const streamId = newUserId;
    if (streamId) {
      // Use email as a temporary placeholder only; updateProfile() will re-sync the real name
      const displayName = email || streamId;
      connectStreamUser(newToken, streamId, displayName, role ?? undefined, undefined, email ?? undefined).catch(
        (e) => console.warn('[Stream] login connect failed:', e)
      );
    }
  };

  const logout = () => {
    const currentUserId = userId;
    setToken(null);
    setUserRole(null);
    setLoginEmail(null);
    setCustomerProfile(null);
    setTailorProfile(null);
    setIsProfileCompleted(false);
    // Disconnect Stream Chat
    disconnectStreamUser().catch((e) => console.warn('[Stream] logout disconnect failed:', e));
    AsyncStorage.multiRemove([
      'authToken', 'userRole', 'loginEmail',
      'userId',
      profileKey('customer'), completedKey('customer'),
      profileKey('tailor'),   completedKey('tailor'),
      ...(currentUserId
        ? [
            profileKey('customer', currentUserId), completedKey('customer', currentUserId),
            profileKey('tailor', currentUserId), completedKey('tailor', currentUserId),
          ]
        : []),
    ]).catch(() => {});
  };

  /** Saves to the role-specific profile key so customer and tailor data never overlap */
  const updateProfile = (profile: UserProfile, roleOverride?: UserRole, userIdOverride?: string | null) => {
    const roleToWrite = roleOverride ?? userRole;
    const idToWrite = userIdOverride ?? userId;

    if (roleToWrite === 'customer') {
      setCustomerProfile((prev) => {
        const next = { ...(prev || {}), ...profile };
        AsyncStorage.setItem(profileKey('customer', idToWrite), JSON.stringify(next)).catch(() => {});
        return next;
      });
    } else if (roleToWrite === 'tailor') {
      setTailorProfile((prev) => {
        const next = { ...(prev || {}), ...profile };
        AsyncStorage.setItem(profileKey('tailor', idToWrite), JSON.stringify(next)).catch(() => {});
        return next;
      });
    }

    // Re-sync phone/email to Stream so other users can see them in chat
    if (token && idToWrite && (profile.phone || profile.email)) {
      const displayName = profile.name || loginEmail || idToWrite;
      connectStreamUser(
        token,
        idToWrite,
        displayName,
        roleToWrite ?? undefined,
        profile.phone ?? undefined,
        profile.email ?? loginEmail ?? undefined
      ).catch(() => {});
    }
  };

  const markProfileCompleted = async (roleOverride?: UserRole, userIdOverride?: string | null) => {
    setIsProfileCompleted(true);
    const roleToWrite = roleOverride ?? userRole;
    const idToWrite = userIdOverride ?? userId;
    if (!roleToWrite) return;
    try {
      await AsyncStorage.setItem(completedKey(roleToWrite, idToWrite), 'true');
    } catch (error) {
      console.error('Error saving profile status:', error);
    }
  };

  // Convenience: whichever profile belongs to the current role
  const user = userRole === 'customer' ? customerProfile : userRole === 'tailor' ? tailorProfile : null;

  return (
    <AuthContext.Provider value={{
      acceptedTerms, acceptTerms,
      token,
      authToken: token,
      userId,
      userPhone: token,   // backward-compat alias
      userRole,
      role: userRole,
      loginEmail,
      login,
      customerProfile,
      tailorProfile,
      user,
      updateProfile,
      isProfileCompleted,
      isAuthLoading,
      markProfileCompleted,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
