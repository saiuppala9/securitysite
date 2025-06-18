import { Container, Title, TextInput, PasswordInput, Button, Paper, Alert, Group, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconX } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { useState } from 'react';

interface AuthTokenResponse {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
    const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length < 1 ? 'Password is required' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError(null);
      const response = await axiosInstance.post<AuthTokenResponse>('/auth/jwt/create/', values);
      const { access, refresh } = response.data;

      const user = await login(access, refresh);

      if (user.is_staff) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail || 'Failed to login. Please check your credentials.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Welcome back!</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && (
          <Alert icon={<IconX size="1rem" />} title="Login Failed" color="red" withCloseButton onClose={() => setError(null)} mb="md">
            {error}
          </Alert>
        )}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            required
            label="Email"
            placeholder="you@yourcompany.com"
            {...form.getInputProps('email')}
          />
          <PasswordInput label="Password" placeholder="Your password" required mt="md" {...form.getInputProps('password')} />
          <Button fullWidth mt="xl" type="submit">
            Sign in
          </Button>
        </form>
        <Group justify="center" mt="md">
          <Anchor component={Link} to="/register" size="sm">
            Don't have an account? Register
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}
