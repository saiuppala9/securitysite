import { Container, Title, Paper, Text, TextInput, Button, Group, Loader, Modal, PinInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

export function ProfilePage() {
    const { user, loading, login } = useAuth();
    const [otpModalOpened, setOtpModalOpened] = useState(false);
    const [passwordModalOpened, setPasswordModalOpened] = useState(false);
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            email: '',
            first_name: '',
            last_name: '',
        },
        validate: {
            first_name: (value: string) => (value.trim().length < 1 ? 'First name is required' : null),
        },
    });

    useEffect(() => {
        if (user) {
            form.setValues({
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
            });
        }
    }, [user]);

    const handleSubmit = async (values: typeof form.values) => {
        setIsSubmitting(true);
        try {
            await axiosInstance.post('/api/profile/update/initiate/', {
                first_name: values.first_name,
                last_name: values.last_name,
            });
            notifications.show({
                title: 'Check your email',
                message: 'An OTP has been sent to your email address for verification.',
                color: 'blue',
            });
            setOtpModalOpened(true);
        } catch (error: any) {
            notifications.show({
                title: 'Update Failed',
                message: error.response?.data?.error || 'An unexpected error occurred.',
                color: 'red',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOtpVerify = async () => {
        setIsSubmitting(true);
        try {
            const response = await axiosInstance.post('/api/profile/update/verify/', { otp });
            const tokens = JSON.parse(localStorage.getItem('authTokens') || '{}');
            // The login function in AuthContext handles updating the user state
            await login(tokens.access, tokens.refresh);

            notifications.show({
                title: 'Success',
                message: 'Your profile has been updated successfully!',
                color: 'green',
            });
            setOtpModalOpened(false);
            setOtp('');
        } catch (error: any) {
            notifications.show({
                title: 'OTP Verification Failed',
                message: error.response?.data?.error || 'An unexpected error occurred.',
                color: 'red',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user) {
        return <Container size="xs" style={{ textAlign: 'center', marginTop: '50px' }}><Loader /></Container>;
    }

    return (
        <Container size="xs" my="xl">
            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <Title ta="center" mb="lg">My Profile</Title>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput
                        label="Email"
                        placeholder="Your email"
                        {...form.getInputProps('email')}
                        disabled
                    />

                    <TextInput
                        label="First Name"
                        placeholder="Your first name"
                        mt="md"
                        required
                        {...form.getInputProps('first_name')}
                    />
                    <TextInput
                        label="Last Name"
                        placeholder="Your last name"
                        mt="md"
                        {...form.getInputProps('last_name')}
                    />
                    <Group justify="space-between" mt="xl">
                        <Button variant="default" onClick={() => setPasswordModalOpened(true)}>Change Password</Button>
                        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
                    </Group>
                </form>
            </Paper>

            <Modal
                opened={otpModalOpened}
                onClose={() => setOtpModalOpened(false)}
                title="Enter Verification OTP"
                centered
            >
                <Text size="sm" mb="md">
                    A 6-digit One-Time Password has been sent to your email address.
                </Text>
                <Group justify="center">
                    <PinInput length={6} value={otp} onChange={setOtp} />
                </Group>
                <Group justify="flex-end" mt="xl">
                    <Button onClick={handleOtpVerify} loading={isSubmitting}>Verify and Update</Button>
                </Group>
            </Modal>

            <ChangePasswordModal 
                opened={passwordModalOpened} 
                onClose={() => setPasswordModalOpened(false)} 
            />
        </Container>
    );
}
