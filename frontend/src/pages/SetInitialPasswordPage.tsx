import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, PasswordInput, Button, Box, Paper, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import axiosInstance from '../utils/axiosInstance';

export function SetInitialPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      notifications.show({
        title: 'Error',
        message: 'Passwords do not match.',
        color: 'red',
      });
      return;
    }
    if (password.length < 8) {
        notifications.show({
            title: 'Error',
            message: 'Password must be at least 8 characters long.',
            color: 'red',
        });
        return;
    }

    setLoading(true);
    try {
      // Our custom endpoint for setting the initial password
      await axiosInstance.post(`/api/set-initial-password/${uid}/${token}/`, {
        new_password: password,
        re_new_password: confirmPassword,
      });

      notifications.show({
        title: 'Success',
        message: 'Your password has been set successfully. You can now log in.',
        color: 'green',
      });
      navigate('/admin/login');
    } catch (error: any) {
      let errorMessage = 'An error occurred. The link may be invalid or expired.';
      if (error.response?.data) {
        // Djoser often returns detailed errors in a list or object
        const errors = error.response.data;
        if (errors.new_password) {
          errorMessage = `Password Error: ${errors.new_password[0]}`;
        } else if (errors.token) {
          errorMessage = `Token Error: ${errors.token[0]}`;
        } else if (errors.uid) {
            errorMessage = `UID Error: ${errors.uid[0]}`;
        }
      }
      notifications.show({
        title: 'Error Setting Password',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" my={40}>
      <Title ta="center">Set Your Account Password</Title>
      <Text c="dimmed" fz="sm" ta="center" mt={5}>
        Welcome! Please choose a secure password to activate your account.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <PasswordInput
          label="New Password"
          placeholder="Enter your new password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          required
        />
        <PasswordInput
          label="Confirm New Password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          required
          mt="md"
        />
        <Button fullWidth mt="xl" onClick={handleSubmit} loading={loading}>
          Set Password and Login
        </Button>
      </Paper>
    </Container>
  );
}
