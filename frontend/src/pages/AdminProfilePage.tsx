import { Container, Title, Paper, TextInput, Button, Group, PasswordInput, Modal, PinInput, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';

export function AdminProfilePage() {
  const { user, fetchUser } = useAuth();
  const [otpModalOpened, setOtpModalOpened] = useState(false);
  const [otp, setOtp] = useState('');
  const [updateType, setUpdateType] = useState<'details' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detailsForm = useForm({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    },
    validate: {
      first_name: (value: string) => (value.length < 2 ? 'First name must have at least 2 letters' : null),
      last_name: (value: string) => (value.length < 2 ? 'Last name must have at least 2 letters' : null),
    },
  });

  const passwordForm = useForm({
    initialValues: {
      new_password: '',
      confirm_password: '',
    },
    validate: {
      new_password: (value: string) => (value.length < 8 ? 'Password must be at least 8 characters long' : null),
      confirm_password: (value: string, values: { new_password: string; confirm_password: string; }) => (value !== values.new_password ? 'Passwords do not match' : null),
    },
  });

  const handleInitiateUpdate = async (type: 'details' | 'password', values: typeof detailsForm.values | typeof passwordForm.values) => {
    setUpdateType(type);
    setError(null);
    try {
      await axiosInstance.post('/api/admin/profile/initiate-update/', { ...values, update_type: type });
      setOtpModalOpened(true);
      notifications.show({
        title: 'OTP Sent',
        message: 'An OTP has been sent to your email address.',
        color: 'green',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate profile update.');
    }
  };

  const handleVerifyUpdate = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setError(null);
    try {
      await axiosInstance.post('/api/admin/profile/verify-update/', { otp });
      setOtpModalOpened(false);
      setOtp('');
      notifications.show({
        title: 'Success',
        message: 'Your profile has been updated successfully.',
        color: 'green',
      });
      await fetchUser(); // Refresh user data in context
      if (updateType === 'password') {
        passwordForm.reset();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify OTP.');
    }
  };

  return (
    <>
      <Modal opened={otpModalOpened} onClose={() => setOtpModalOpened(false)} title="Enter OTP" centered>
        <Container size="xs">
          <p>An OTP has been sent to your email. Please enter it below to confirm your changes.</p>
          <Group justify="center">
            <PinInput length={6} value={otp} onChange={setOtp} />
          </Group>
          {error && (
            <Alert color="red" title="Error" icon={<IconX />} mt="md" withCloseButton onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Button fullWidth mt="xl" onClick={handleVerifyUpdate}>
            Verify and Update
          </Button>
        </Container>
      </Modal>

      <Container fluid>
        <Title order={2} mb="xl">Admin Profile</Title>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Title order={4}>Update Your Details</Title>
          <form onSubmit={detailsForm.onSubmit((values: typeof detailsForm.values) => handleInitiateUpdate('details', values))}>
            <TextInput label="Email" placeholder={user?.email} disabled mt="md" />
            <TextInput label="First Name" {...detailsForm.getInputProps('first_name')} required mt="md" />
            <TextInput label="Last Name" {...detailsForm.getInputProps('last_name')} required mt="md" />
            <Button type="submit" mt="xl">Update Details</Button>
          </form>
        </Paper>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Title order={4}>Change Password</Title>
          <form onSubmit={passwordForm.onSubmit((values: typeof passwordForm.values) => handleInitiateUpdate('password', values))}>
            <PasswordInput label="New Password" {...passwordForm.getInputProps('new_password')} required mt="md" />
            <PasswordInput label="Confirm New Password" {...passwordForm.getInputProps('confirm_password')} required mt="md" />
            <Button type="submit" mt="xl">Change Password</Button>
          </form>
        </Paper>
      </Container>
    </>
  );
}
