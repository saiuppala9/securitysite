import { useState, useEffect } from 'react';
import { Paper, Title, Text, TextInput, Button, Box, Flex, Image, Stack, PasswordInput, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import brandLogo from '../assets/brand.png';
import backgroundImage from '../assets/cyberdash.jpg';
import { notifications } from '@mantine/notifications';
import axiosInstance from '../utils/axiosInstance';

// Define types
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser?: boolean;
  groups?: string[];
}

interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const tokens = localStorage.getItem('authTokens');
      if (tokens) {
        try {
          const parsedTokens = JSON.parse(tokens);
          const response = await axios.get<User>('http://localhost:8000/auth/users/me/', {
            headers: {
              Authorization: `Bearer ${parsedTokens.access}`
            }
          });
          
          if (response.data.is_staff) {
            navigate('/admin/dashboard', { replace: true });
          }
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('authTokens');
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  const form = useForm({
    initialValues: {
      email: 'admin@cyphex.in',
      password: 'Sai@1234',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length > 0 ? null : 'Password is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError(null);
      setIsLoading(true);

      // Get tokens
      const response = await axios.post<LoginResponse>(
        'http://localhost:8000/auth/jwt/create/', 
        {
          email: values.email,
          password: values.password,
        }
      );

      const { access, refresh, user: responseUser } = response.data;
      
      // Store tokens
      localStorage.setItem('authTokens', JSON.stringify({ access, refresh }));
      
      // Set the authorization header for subsequent requests
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      // If user info not included in response, fetch it
      let userData: User | undefined = responseUser;
      
      if (!userData) {
        const userResponse = await axios.get<User>('http://localhost:8000/auth/users/me/', {
          headers: {
            Authorization: `Bearer ${access}`
          }
        });
        
        userData = userResponse.data;
      }
      
      // Check if user is admin
      if (!userData?.is_staff) {
        localStorage.removeItem('authTokens');
        delete axiosInstance.defaults.headers.common['Authorization'];
        setError('You do not have permission to access the admin dashboard.');
        return;
      }

      // Store user data in localStorage for easy access
      localStorage.setItem('userData', JSON.stringify(userData));

      // Success notification
      notifications.show({
        title: 'Login Successful',
        message: `Welcome back, ${userData.first_name}!`,
        color: 'teal',
      });

      // Redirect to admin dashboard using window.location for a full page reload
      window.location.href = '/admin/dashboard';
      
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid email or password.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      localStorage.removeItem('authTokens');
      delete axiosInstance.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
      }}
    >
      <Flex justify="center" align="center" style={{ minHeight: '100vh', width: '100%' }}>
        <Stack align="center" gap="xl">
          <Image src={brandLogo} h={120} w="auto" fit="contain" className="brand-logo" />
          <Paper
            withBorder
            shadow="md"
            p={30}
            radius="md"
            className="glass-card"
            style={{ width: 420 }}
          >
            <Title ta="center" order={2} mb="xl">
              Admin Portal
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
              Please log in to continue.
            </Text>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <TextInput 
                label="Email" 
                placeholder="you@yourcompany.com" 
                required 
                {...form.getInputProps('email')} 
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                mt="md"
                {...form.getInputProps('password')}
              />
              {error && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Login Failed" color="red" mt="md">
                  {error}
                </Alert>
              )}
              <Button 
                fullWidth 
                mt="xl" 
                type="submit" 
                loading={isLoading}
                variant="gradient" 
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Sign in
              </Button>
            </form>
          </Paper>
        </Stack>
      </Flex>
    </Box>
  );
}
