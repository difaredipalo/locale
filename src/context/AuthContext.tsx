import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types/database';
import { api } from '../lib/api';

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  login: (identifier: string) => Promise<UserProfile>;
  register: (payload: { email: string; username: string; first_name: string; last_name: string }) => Promise<UserProfile>;
  logout: () => void;
  updateProfile: (payload: { first_name: string; last_name: string; phone?: string; avatar_url?: string }) => Promise<UserProfile>;
  refreshUsers: () => Promise<void>;
  switchUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
      return data;
    } catch (err) {
      console.error('Error fetching users:', err);
      return [];
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const loadedUsers = await fetchUsers();

      // Check stored user session
      const storedId = localStorage.getItem('covo_active_user_id');
      if (storedId) {
        const found = loadedUsers.find(u => u.id === storedId && u.is_active);
        if (found) {
          setCurrentUser(found);
        } else {
          localStorage.removeItem('covo_active_user_id');
        }
      }
      setLoading(false);
    };

    init();
  }, []);

  const login = async (identifier: string): Promise<UserProfile> => {
    const res = await api.login(identifier);
    setCurrentUser(res.user);
    localStorage.setItem('covo_active_user_id', res.user.id);
    await fetchUsers();
    return res.user;
  };

  const register = async (payload: { email: string; username: string; first_name: string; last_name: string }): Promise<UserProfile> => {
    const res = await api.register(payload);
    setCurrentUser(res.user);
    localStorage.setItem('covo_active_user_id', res.user.id);
    await fetchUsers();
    return res.user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('covo_active_user_id');
  };

  const updateProfile = async (payload: { first_name: string; last_name: string; phone?: string; avatar_url?: string }): Promise<UserProfile> => {
    if (!currentUser) throw new Error('Non autenticato');
    const res = await api.updateProfile({ id: currentUser.id, ...payload });
    setCurrentUser(res.user);
    await fetchUsers();
    return res.user;
  };

  const switchUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('covo_active_user_id', user.id);
  };

  const role = currentUser?.role || 'user';
  const isAdmin = role === 'admin';
  const isManager = role === 'admin' || role === 'manager';
  const isUser = Boolean(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loading,
        isAdmin,
        isManager,
        isUser,
        login,
        register,
        logout,
        updateProfile,
        refreshUsers: async () => {
          await fetchUsers();
        },
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
