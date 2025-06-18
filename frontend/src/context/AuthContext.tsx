import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import axiosInstance from '../utils/axiosInstance';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
}

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (access: string, refresh: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
  };

  useEffect(() => {
    const verifyUserOnLoad = async () => {
      try {
        const storedTokens = localStorage.getItem('authTokens');
        if (storedTokens) {
          const parsedTokens = JSON.parse(storedTokens);
          setTokens(parsedTokens);
          const { data } = await axiosInstance.get<User>('/auth/users/me/');
          setUser(data);
        }
      } catch (error) {
        console.error('Initial token verification failed.', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUserOnLoad();
  }, []);

  const login = async (access: string, refresh: string): Promise<User> => {
    const newTokens = { access, refresh };
    localStorage.setItem('authTokens', JSON.stringify(newTokens));
    setTokens(newTokens);

    // Set the authorization header for subsequent requests
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;

    try {
      const { data: user } = await axiosInstance.get<User>('/auth/users/me/');
      setUser(user);
      return user;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await axiosInstance.get<User>('/auth/users/me/');
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user data.', error);
      logout();
    }
  };

  const contextData: AuthContextType = {
    user,
    tokens,
    login,
    logout,
    loading,
    fetchUser,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

