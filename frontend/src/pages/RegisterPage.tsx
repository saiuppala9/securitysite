import { Paper, Title, TextInput, Button, Container, Group, Anchor, Alert, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconX } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useState } from 'react';



export function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      re_password: '',
      first_name: '',
      last_name: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length < 8 ? 'Password must have at least 8 characters' : null),
      re_password: (value: string, values: { password: any }) => (value !== values.password ? 'Passwords did not match' : null),
      first_name: (value: string) => (value.length < 1 ? 'First name is required' : null),
      last_name: (value: string) => (value.length < 1 ? 'Last name is required' : null),
    },
  });

  const handleSubmit = async (values: Omit<typeof form.values, 're_password'>) => {
    try {
      await axiosInstance.post('/auth/users/', values);
      setIsRegistered(true);
      setError(null);
    } catch (err: any) {
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        const errorMessages: string[] = [];
        for (const key in errorData) {
          if (Object.prototype.hasOwnProperty.call(errorData, key)) {
            const value = errorData[key];
            if (Array.isArray(value)) {
              errorMessages.push(`${key}: ${value.join(', ')}`);
            } else {
              errorMessages.push(`${key}: ${String(value)}`);
            }
          }
        }
        setError(errorMessages.join('; '));
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  if (isRegistered) {
    return (
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Title ta="center">Registration Successful</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            Please check your email for an activation link to complete the process.
          </Text>
          <Button component={Link} to="/login" fullWidth mt="xl">
            Back to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center">Create an account</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && (
          <Alert icon={<IconX size="1rem" />} title="Registration Failed" color="red" withCloseButton onClose={() => setError(null)} mb="md">
            {error}
          </Alert>
        )}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Email" placeholder="your@email.com" required {...form.getInputProps('email')} />
          <TextInput label="First Name" placeholder="First Name" required mt="md" {...form.getInputProps('first_name')} />
          <TextInput label="Last Name" placeholder="Last Name" required mt="md" {...form.getInputProps('last_name')} />
          <TextInput type="password" label="Password" placeholder="Your password" required mt="md" {...form.getInputProps('password')} />
          <TextInput type="password" label="Confirm Password" placeholder="Confirm password" required mt="md" {...form.getInputProps('re_password')} />
          <Button fullWidth mt="xl" type="submit">
            Register
          </Button>
        </form>
        <Group justify="center" mt="md">
          <Anchor component={Link} to="/login" size="sm">
            Already have an account? Login
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}
