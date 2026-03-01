/**
 * @file UserContext.tsx
 * @description 用户状态全局Context
 * @copyright 版权所有 (c) 2026 UIED技术团队
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import userService, { User, LoginParams, RegisterParams, LoginTwoFactorChallenge, AuthResponse } from '../services/userService';

interface LoginActionResult {
  need2fa: boolean;
  challenge?: LoginTwoFactorChallenge;
}

interface UserContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isLoggedIn: boolean;
  login: (params: LoginParams) => Promise<LoginActionResult>;
  verifyLoginTwoFactor: (params: { challengeToken: string; code: string }) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);
const USER_PROFILE_CACHE_KEY = 'cached_user_profile';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 写入登录完成态（token + 用户信息）
   */
  const applyAuthSuccess = useCallback((authData: AuthResponse) => {
    const token = String(authData?.token || '').trim();
    if (!token) return;
    localStorage.setItem('token', token);
    const nextUser = (authData.userInfo || authData.user || null) as User | null;
    setUser(nextUser);
    localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(nextUser || {}));
  }, []);

  useEffect(() => {
    /**
     * 初始化用户登录态
     */
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const cachedProfileRaw = localStorage.getItem(USER_PROFILE_CACHE_KEY);
      if (cachedProfileRaw) {
        try {
          const cachedProfile = JSON.parse(cachedProfileRaw) as User;
          if (cachedProfile && Number(cachedProfile.id || 0) > 0) {
            setUser(cachedProfile);
          }
        } catch (error) {
          localStorage.removeItem(USER_PROFILE_CACHE_KEY);
        }
      }

      if (token) {
        try {
          const userProfile = await userService.getProfile();
          setUser(userProfile);
          localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(userProfile));
        } catch (err) {
          const authInvalid = Boolean((err as any)?.authInvalid);
          if (authInvalid) {
            localStorage.removeItem('token');
            localStorage.removeItem(USER_PROFILE_CACHE_KEY);
            setUser(null);
          } else {
            // 网络抖动或临时接口错误时不清 token，避免频繁被动掉线
            console.error('Restore session failed (kept token):', err);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  /**
   * 执行登录并写入用户状态
   */
  const login = useCallback(async (params: LoginParams): Promise<LoginActionResult> => {
    setLoading(true);
    setError(null);
    try {
      const loginResult = await userService.login(params);
      if ((loginResult as LoginTwoFactorChallenge).need2fa) {
        return {
          need2fa: true,
          challenge: loginResult as LoginTwoFactorChallenge,
        };
      }
      applyAuthSuccess(loginResult as AuthResponse);
      return { need2fa: false };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('登录失败');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyAuthSuccess]);

  /**
   * 完成登录 2FA 验证并写入登录态
   */
  const verifyLoginTwoFactor = useCallback(async (params: { challengeToken: string; code: string }) => {
    setLoading(true);
    setError(null);
    try {
      const authData = await userService.verifyLoginTwoFactor(params);
      applyAuthSuccess(authData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('二次验证失败');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyAuthSuccess]);

  /**
   * 执行注册并写入用户状态
   */
  const register = useCallback(async (params: RegisterParams) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user: userData, userInfo } = await userService.register(params);
      localStorage.setItem('token', token);
      const nextUser = userInfo || userData;
      setUser(nextUser);
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(nextUser || {}));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('注册失败');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 执行注销并清理登录态
   */
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await userService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem(USER_PROFILE_CACHE_KEY);
      setUser(null);
      setLoading(false);
    }
  }, []);

  /**
   * 刷新用户信息
   */
  const refreshProfile = useCallback(async () => {
    try {
      const userProfile = await userService.getProfile();
      setUser(userProfile);
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(userProfile));
    } catch (err) {
      const authInvalid = Boolean((err as any)?.authInvalid);
      if (authInvalid) {
        localStorage.removeItem('token');
        localStorage.removeItem(USER_PROFILE_CACHE_KEY);
        setUser(null);
      } else {
        console.error('Refresh profile error (kept session):', err);
      }
    }
  }, []);

  /**
   * 清理认证错误信息
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: UserContextValue = {
    user,
    loading,
    error,
    isLoggedIn: !!user,
    login,
    verifyLoginTwoFactor,
    register,
    logout,
    refreshProfile,
    clearError,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * 获取用户上下文
 */
export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
