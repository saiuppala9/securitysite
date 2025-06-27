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

  useEffect(() => {
    const storedTokens = localStorage.getItem('authTokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        const decodedToken: any = JSON.parse(atob(tokens.access.split('.')[1]));
        const userData: User = {
          id: decodedToken.user_id,
          email: decodedToken.email,
          username: decodedToken.username,
          first_name: decodedToken.first_name,
          last_name: decodedToken.last_name,
          is_staff: decodedToken.is_staff,
          is_superuser: decodedToken.is_superuser,
          groups: decodedToken.groups,
        };
        setUser(userData);
        setTokens(tokens);
      } catch (error) {
        console.error('Failed to parse auth tokens from localStorage', error);
        localStorage.removeItem('authTokens');
      }
    }
    setLoading(false);
  }, []);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
    delete axiosInstance.defaults.headers.common['Authorization'];
    
    // Redirect to appropriate login page based on current route
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    window.location.href = isAdminRoute ? '/admin/login' : '/login';
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
    setLoading(true);
    const newTokens = { access, refresh };
    localStorage.setItem('authTokens', JSON.stringify(newTokens));
    setTokens(newTokens);

    // Set the authorization header for subsequent requests
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;

    try {
      const { data: user } = await axiosInstance.get<User>('/auth/users/me/');
      
      // Check if this is an admin route
      const isAdminRoute = window.location.pathname.includes('/admin');
      
      // If this is an admin route but user is not staff, throw error
      if (isAdminRoute && !user.is_staff) {
        localStorage.removeItem('authTokens');
        delete axiosInstance.defaults.headers.common['Authorization'];
        throw new Error('You do not have permission to access the admin area.');
      }
      
      setUser(user);
      
      // Handle redirections based on user type and current route
      if (user.is_staff && isAdminRoute) {
        window.location.href = '/admin/dashboard';
      } else if (!user.is_staff && isAdminRoute) {
        window.location.href = '/login';
      } else if (!isAdminRoute) {
        window.location.href = '/dashboard';
      }
      
      return user;
    } catch (error) {
      // Clear any stored tokens and headers
      localStorage.removeItem('authTokens');
      delete axiosInstance.defaults.headers.common['Authorization'];
      setTokens(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
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

