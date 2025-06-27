import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Group,
  Anchor,
  Box,
  Flex,
  Image,
  Stack,
  Alert,
  Grid,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { IconX } from '@tabler/icons-react';
import brandLogo from '../assets/brand.png';
import backgroundImage from '../assets/cyberdash.jpg';
import { useState } from 'react';

const schema = z
  .object({
    email: z.string().email({ message: 'Invalid email' }),
    first_name: z.string().min(1, { message: 'First name is required' }),
    last_name: z.string().min(1, { message: 'Last name is required' }),
    password: z.string().min(8, { message: 'Password should have at least 8 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirmPassword: '',
    },
    validate: zodResolver(schema),
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError(null);
      // The backend requires username and re_password for confirmation.
      await axios.post('http://localhost:8000/auth/users/', {
        username: values.email,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password,
        re_password: values.confirmPassword,
      });
      setRegistrationSuccess(true);
    } catch (err: any) {
      console.error('Registration Error:', err.response);
      if (err.response && err.response.data) {
        const apiError = err.response.data;
        // Handle specific field errors from the backend
        if (apiError.username) {
          form.setFieldError('email', apiError.username.join(', '));
        } else if (apiError.email) {
          form.setFieldError('email', apiError.email.join(', '));
        } else if (apiError.password) {
          form.setFieldError('password', apiError.password.join(', '));
        } else {
          // Display a generic error if the field is not recognized
          const errorMessages = Object.values(apiError).flat().join(' ');
          setError(errorMessages || 'An unexpected error occurred. Please try again.');
        }
      } else {
        setError('An unexpected error occurred during registration.');
      }
    }
  };

  if (registrationSuccess) {
    return (
      <Box
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper withBorder shadow="md" p={30} radius="md" className="glass-card">
          <Title order={2} ta="center">Registration Successful</Title>
          <Text color="dimmed" size="sm" ta="center" mt="md">
            Please check your email to activate your account.
          </Text>
          <Group justify="center" mt="lg">
            <Button component={Link} to="/login" fullWidth>
              Back to Login
            </Button>
          </Group>
        </Paper>
      </Box>
    );
  }

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
              Create an Account
            </Title>
            {error && (
              <Alert
                icon={<IconX size="1rem" />}
                title="Registration Failed"
                color="red"
                withCloseButton
                onClose={() => setError(null)}
                mb="md"
              >
                {error}
              </Alert>
            )}
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="First Name"
                    placeholder="John"
                    required
                    {...form.getInputProps('first_name')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Last Name"
                    placeholder="Doe"
                    required
                    {...form.getInputProps('last_name')}
                  />
                </Grid.Col>
              </Grid>
              <TextInput
                label="Email Address"
                placeholder="you@yourcompany.com"
                required
                mt="md"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                mt="md"
                {...form.getInputProps('password')}
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm password"
                required
                mt="md"
                {...form.getInputProps('confirmPassword')}
              />
              <Button fullWidth mt="xl" type="submit">
                Register
              </Button>
              <Text color="dimmed" size="sm" ta="center" mt="md">
                Already have an account?{' '}
                <Anchor component={Link} to="/login" size="sm">
                  Login
                </Anchor>
              </Text>
            </form>
          </Paper>
        </Stack>
      </Flex>
    </Box>
  );
}
