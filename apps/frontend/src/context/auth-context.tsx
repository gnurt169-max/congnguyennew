'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CustomerUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  role?: string | null;
  companyName?: string | null;
  workshopAddress?: string | null;
}

interface AuthContextType {
  user: CustomerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: CustomerUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Khôi phục từ localStorage và cookie khi khởi chạy
    const storedToken =
      localStorage.getItem('admin_token') ||
      localStorage.getItem('customer_token') ||
      localStorage.getItem('token');
    const storedUser =
      localStorage.getItem('admin_user') ||
      localStorage.getItem('customer_user');

    if (storedToken && storedUser) {
      try {
        const parsed: CustomerUser = JSON.parse(storedUser);
        const isLegacyAdminEmail =
          parsed.email === 'admin@bakery.vn' ||
          parsed.email === 'admin@congnguyen.vn' ||
          (parsed.role === 'ADMIN' &&
            (!parsed.email ||
              parsed.email === 'admin' ||
              parsed.email.endsWith('@bakery.vn') ||
              parsed.email.endsWith('@congnguyen.vn')));

        if (isLegacyAdminEmail) {
          parsed.email = 'admin@congnguyen.com.vn';
          localStorage.setItem('customer_user', JSON.stringify(parsed));
          if (parsed.role === 'ADMIN') {
            localStorage.setItem('admin_user', JSON.stringify(parsed));
          }
        }

        setToken(storedToken);
        setUser(parsed);
      } catch {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_user');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (newToken: string, newUser: CustomerUser) => {
    const isLegacyAdminEmail =
      newUser.email === 'admin@bakery.vn' ||
      newUser.email === 'admin@congnguyen.vn' ||
      (newUser.role === 'ADMIN' &&
        (!newUser.email ||
          newUser.email === 'admin' ||
          newUser.email.endsWith('@bakery.vn') ||
          newUser.email.endsWith('@congnguyen.vn')));

    const sanitizedUser: CustomerUser = {
      ...newUser,
      email: isLegacyAdminEmail ? 'admin@congnguyen.com.vn' : newUser.email,
    };

    setToken(newToken);
    setUser(sanitizedUser);
    localStorage.setItem('customer_token', newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('customer_user', JSON.stringify(sanitizedUser));
    document.cookie = `customer_token=${newToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    document.cookie = `user_role=${sanitizedUser.role || 'CUSTOMER'}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    if (sanitizedUser.role === 'ADMIN') {
      localStorage.setItem('admin_token', newToken);
      localStorage.setItem('admin_user', JSON.stringify(sanitizedUser));
      document.cookie = `admin_token=${newToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    document.cookie = 'customer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
