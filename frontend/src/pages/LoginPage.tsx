import {
  Container,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Alert,
  Group,
  Anchor,
  Grid,
  Text,
  Box,
} from '@mantine/core';
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
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container size="lg" style={{ width: '100%' }}>
        <Grid grow gutter={0}>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Box
              p="xl"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Title order={1} mb="lg">
                CypherX Security
              </Title>
              <Text c="dimmed" mb="xl">
                Advanced security solutions for the modern web. Log in to access your dashboard.
              </Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="xl" shadow="xl" radius="lg">
              <Title order={2} ta="center" mb="xl">
                Welcome Back
              </Title>
              {error && (
                <Alert
                  icon={<IconX size="1rem" />}
                  title="Login Failed"
                  color="red"
                  withCloseButton
                  onClose={() => setError(null)}
                  mb="md"
                  radius="md"
                >
                  {error}
                </Alert>
              )}
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                  required
                  label="Email Address"
                  placeholder="you@yourcompany.com"
                  {...form.getInputProps('email')}
                  size="md"
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  required
                  mt="lg"
                  {...form.getInputProps('password')}
                  size="md"
                />
                <Button fullWidth mt="xl" type="submit" size="lg">
                  Sign In
                </Button>
              </form>
              <Group justify="center" mt="md">
                <Anchor component={Link} to="/register" size="sm" c="dimmed">
                  Don't have an account? Register
                </Anchor>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
