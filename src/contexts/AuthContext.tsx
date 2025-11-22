import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import ApiService from '../services/apiService';

interface AuthContextValue {
  user: any;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (value: any) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await ApiService.getUserProfile();
      setUser(profile ?? null);
    } catch (error) {
      // If session expired or API unavailable, just clear the user in context
      console.log('[AuthContext] Error refreshing user:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (typeof ApiService.logout === 'function') {
        await ApiService.logout();
      }
      // Clear tokens from storage
      await ApiService.setToken(null, null);
    } catch (error) {
      // ignore logout errors – we just want to clear local state
      console.warn('[AuthContext] Logout error (ignored):', error);
    } finally {
      setUser(null);
    }
  }, []);

  // Removed automatic refreshUser call on mount to prevent crashes
  // Components should call refreshUser() explicitly when needed

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refreshUser, setUser, signOut }),
    [user, loading, refreshUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
