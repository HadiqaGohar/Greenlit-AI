"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

function generateUid(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'user_' + Math.abs(hash).toString(36);
}

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface RegisteredUser {
  email: string;
  password: string;
  uid: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRegisteredUsers(): RegisteredUser[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('registered_users');
  return data ? JSON.parse(data) : [];
}

function saveRegisteredUsers(users: RegisteredUser[]) {
  localStorage.setItem('registered_users', JSON.stringify(users));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const users = getRegisteredUsers();
      const found = users.find(u => u.email === email);

      if (!found) {
        throw new Error('No account found with this email. Please sign up first.');
      }

      if (found.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }

      const loggedInUser: User = { uid: found.uid, email: found.email, displayName: found.email.split('@')[0] };
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const users = getRegisteredUsers();
      const exists = users.find(u => u.email === email);

      if (exists) {
        throw new Error('An account with this email already exists. Please sign in.');
      }

      const uid = generateUid(email);
      const newUser: RegisteredUser = { email, password, uid };
      users.push(newUser);
      saveRegisteredUsers(users);

      const loggedInUser: User = { uid, email, displayName: email.split('@')[0] };
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    googleLogout();
    localStorage.removeItem('user');
    setUser(null);
  };

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();

        const email = profile.email || '';
        const displayName = profile.name || email.split('@')[0];
        const photoURL = profile.picture || '';

        const users = getRegisteredUsers();
        let found = users.find(u => u.email === email);

        if (!found) {
          const uid = generateUid(email);
          found = { email, password: 'google_auth', uid };
          users.push(found);
          saveRegisteredUsers(users);
        }

        const loggedInUser: User = {
          uid: found.uid,
          email,
          displayName,
          photoURL,
        };
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setLoading(false);
    },
  });

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      googleLogin();
    } catch {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
