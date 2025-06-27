import {
  TextInput,
  PasswordInput,
  Anchor,
  Paper,
  Title,
  Text,
  Button,
  Box,
  Flex,
  Image,
  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/brand.png';
import backgroundImage from '../assets/cyberdash.jpg';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

interface LoginResponse {
  access: string;
  refresh: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: zodResolver(schema),
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const response = await axios.post<LoginResponse>('http://localhost:8000/auth/jwt/create/', {
        email: values.email,
        password: values.password,
      });

      const { access, refresh } = response.data;
      
      // Store tokens in localStorage
      localStorage.setItem('authTokens', JSON.stringify({ access, refresh }));
      
      // Decode token to get user data
      const decodedToken: any = JSON.parse(atob(access.split('.')[1]));
      const userData = {
        id: decodedToken.user_id,
        email: decodedToken.email,
        username: decodedToken.username,
        first_name: decodedToken.first_name,
        last_name: decodedToken.last_name,
        is_staff: decodedToken.is_staff,
        is_superuser: decodedToken.is_superuser,
        groups: decodedToken.groups,
      };
      
      // Store user data in localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Also use the context login for compatibility
      await login(access, refresh);

      notifications.show({
        title: 'Login Successful',
        message: 'Welcome back!',
        color: 'teal',
      });

      // Use direct navigation instead of React Router
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      notifications.show({
        title: 'Login Failed',
        message: 'Invalid credentials or server error. Please try again.',
        color: 'red',
        icon: <IconX />,
      });
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
              Welcome Back
            </Title>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <TextInput
                label="Email Address"
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
              <Button fullWidth mt="xl" type="submit" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                Sign In
              </Button>
              <Text color="dimmed" size="sm" ta="center" mt="md">
                Don't have an account?{' '}
                <Anchor component={Link} to="/register" size="sm">
                  Register
                </Anchor>
              </Text>
            </form>
          </Paper>
        </Stack>
      </Flex>
    </Box>
  );
}
