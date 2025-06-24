import {
  Container,
  Title,
  Image,
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
import brandLogo from '../assets/brand.png';
import '../components/Logo.css';
import cyberdashBg from '../assets/cyberdash.jpg';
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
    <Box
      style={{
        minHeight: '100vh',
        backgroundImage: `url(${cyberdashBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <Container size="xl" style={{ width: '100%' }}>
        <Grid grow gutter={0} align="stretch">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                paddingRight: '2rem',
                color: 'white',
              }}
            >
              <Image
                src={brandLogo}
                h={80}
                w="auto"
                alt="CypherX Security brand logo"
                mb="xl"
                className="brand-logo"
              />
              <Text c="gray.2" fz="xl">
                Advanced security solutions for the modern web. Log in to access your dashboard.
              </Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper
              p="xl"
              radius="lg"
              style={theme => ({
                backgroundColor: 'rgba(10, 20, 40, 0.5)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 123, 255, 0.25)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                height: '100%',
              })}
            >
              <Title order={1} ta="center" mb="xl" c="white" fz="2.5rem">
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
                  variant="filled"
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
                  size="lg"
                  styles={theme => ({
                    label: { color: theme.colors.gray[3], marginBottom: '0.5rem' },
                    input: {
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      border: `1px solid ${theme.colors.blue[9]}`,
                      color: 'white',
                      fontSize: theme.fontSizes.md,
                      '&::placeholder': {
                        color: theme.colors.gray[6],
                      },
                    },
                  })}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  required
                  mt="lg"
                  {...form.getInputProps('password')}
                  size="lg"
                  styles={theme => ({
                    label: { color: theme.colors.gray[3], marginBottom: '0.5rem' },
                    input: {
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      border: `1px solid ${theme.colors.blue[9]}`,
                      color: 'white',
                      fontSize: theme.fontSizes.md,
                      '&::placeholder': {
                        color: theme.colors.gray[6],
                      },
                    },
                  })}
                />
                <Button
                  fullWidth
                  mt="xl"
                  type="submit"
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                >
                  Sign In
                </Button>
              </form>
              <Group justify="center" mt="lg">
                <Anchor component={Link} to="/register" size="sm" c="gray.4">
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
