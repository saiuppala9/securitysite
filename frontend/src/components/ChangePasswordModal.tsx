import { Modal, Button, PasswordInput, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';

interface ChangePasswordModalProps {
    opened: boolean;
    onClose: () => void;
}

export function ChangePasswordModal({ opened, onClose }: ChangePasswordModalProps) {
    const form = useForm({
        initialValues: {
            new_password: '',
            re_new_password: '',
            current_password: '',
        },
        validate: {
            new_password: (value: string) => (value.length < 8 ? 'Password must have at least 8 characters' : null),
            re_new_password: (value: string, values: { new_password: string }) => (value !== values.new_password ? 'Passwords did not match' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        try {
            await axiosInstance.post('/auth/users/set_password/', values);
            notifications.show({
                title: 'Success',
                message: 'Your password has been changed successfully.',
                color: 'green',
            });
            onClose();
            form.reset();
        } catch (error: any) {
            const errorMessage = error.response?.data?.current_password?.[0] || 'An error occurred.';
            notifications.show({
                title: 'Error',
                message: errorMessage,
                color: 'red',
            });
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Change Password" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <PasswordInput
                    label="Current Password"
                    placeholder="Your current password"
                    required
                    {...form.getInputProps('current_password')}
                />
                <PasswordInput
                    label="New Password"
                    placeholder="Your new password"
                    mt="md"
                    required
                    {...form.getInputProps('new_password')}
                />
                <PasswordInput
                    label="Confirm New Password"
                    placeholder="Confirm your new password"
                    mt="md"
                    required
                    {...form.getInputProps('re_new_password')}
                />
                <Group justify="flex-end" mt="xl">
                    <Button type="submit">Change Password</Button>
                </Group>
            </form>
        </Modal>
    );
}
