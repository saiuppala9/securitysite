import { useState } from 'react';
import { Paper, Title, Text, TextInput, Button, Container, Group, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';

interface AuthTokenResponse {
  access: string;
  refresh: string;
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length > 0 ? null : 'Password is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError(null);
      const response = await axiosInstance.post<AuthTokenResponse>('/auth/jwt/create/', values);
      const { access, refresh } = response.data;

      const user = await login(access, refresh);

      if (user && user.is_staff) {
        navigate(from, { replace: true });
      } else {
        setError('You do not have permission to access the admin dashboard.');
        // Note: We might want to log the user out here if they are not an admin.
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
      <Title ta="center">
        Admin Portal
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Please log in to continue.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Email" placeholder="you@yourcompany.com" required {...form.getInputProps('email')} />
          <TextInput type="password" label="Password" placeholder="Your password" required mt="md" {...form.getInputProps('password')} />
          {error && (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Login Failed" color="red" mt="md">
              {error}
            </Alert>
          )}
          <Button fullWidth mt="xl" type="submit">
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
