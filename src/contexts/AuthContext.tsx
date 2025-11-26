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
  const [loading, setLoading] = useState<boolean>(true); // Start with true for initial load

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

  // Auto-login on mount if refresh token exists
  React.useEffect(() => {
    const attemptAutoLogin = async () => {
      try {
        setLoading(true);
        // Load tokens from storage
        await ApiService.loadTokens();
        
        // Try to refresh token if we have one
        if (ApiService.refreshTokenValue) {
          try {
            const tokens = await ApiService.refreshToken();
            if (tokens?.accessToken) {
              await ApiService.setToken(tokens.accessToken, tokens.refreshToken || ApiService.refreshTokenValue);
              // Load user profile after successful token refresh
              await refreshUser();
              return;
            }
          } catch (refreshError) {
            console.log('[AuthContext] Auto-login failed (refresh token invalid/expired):', refreshError.message);
            // Clear invalid tokens
            await ApiService.setToken(null, null);
          }
        }
        
        // If no refresh token or refresh failed, try to load user with existing token
        if (ApiService.token) {
          await refreshUser();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.log('[AuthContext] Auto-login error:', error.message);
        setUser(null);
        setLoading(false);
      }
    };

    attemptAutoLogin();
  }, [refreshUser]);

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
