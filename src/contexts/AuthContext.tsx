import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'admin' | 'agent';
  region: string;
  location: string;
  crops: string[];
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  region: string;
  location: string;
  role?: string;
  crops?: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Set default authorization header
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token and get user profile
      authAPI.get('/auth/profile')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          delete authAPI.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setToken(newToken);
      setUser(userData);
      
      toast.success(`Welcome, ${userData.name}!`);
    } catch (error: unknown) {
      interface APIError {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
      let message = 'Internet error, please try again later';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as APIError).response?.data?.message
      ) {
        message = (error as APIError).response!.data!.message!;
      }
      toast.error(message);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authAPI.post('/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setToken(newToken);
      setUser(newUser);
      
      toast.success('Account created successfully!');
    } catch (error: unknown) {
      interface APIError {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
      let message = 'Error while creating account, please try again';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as APIError).response?.data?.message
      ) {
        message = (error as APIError).response!.data!.message!;
      }
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete authAPI.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logout succesful!');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};