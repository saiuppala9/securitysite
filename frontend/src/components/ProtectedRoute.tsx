import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  username?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_superuser?: boolean;
  groups?: string[];
}

export function ProtectedRoute() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('userData');
    const authTokens = localStorage.getItem('authTokens');
    
    if (userData && authTokens) {
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user) {
    // Use window.location for a full page reload
    window.location.href = '/login';
    return null;
  }

  if (user.is_staff) {
    // Use window.location for a full page reload
    window.location.href = '/admin/dashboard';
    return null;
  }

  return <Outlet />;
}
