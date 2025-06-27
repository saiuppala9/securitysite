import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import axiosInstance from '../utils/axiosInstance';

interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser?: boolean;
  groups?: string[];
}

export function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const tokens = localStorage.getItem('authTokens');
      
      if (!tokens) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        // First try to get user data from localStorage for performance
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.is_staff) {
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        }
        
        // If no user data in localStorage or not admin, fetch from API
        const response = await axiosInstance.get<UserResponse>('/auth/users/me/');
        
        if (response.data && response.data.is_staff === true) {
          // Store user data for future use
          localStorage.setItem('userData', JSON.stringify(response.data));
          setIsAdmin(true);
        } else {
          // Not an admin, remove tokens
          localStorage.removeItem('authTokens');
          localStorage.removeItem('userData');
          delete axiosInstance.defaults.headers.common['Authorization'];
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        // Token is invalid or expired
        localStorage.removeItem('authTokens');
        localStorage.removeItem('userData');
        delete axiosInstance.defaults.headers.common['Authorization'];
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  // If not admin, redirect to login
  if (isAdmin === false) {
    // Use window.location for a full page reload to avoid React Router issues
    window.location.href = '/admin/login';
    return null;
  }

  // Allow access to the route
  return <Outlet />;
}
