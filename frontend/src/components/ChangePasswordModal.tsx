import { Modal, Button, PasswordInput, Group, Box, Progress, Text, Popover } from '@mantine/core';
import { useForm } from '@mantine/form';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';

interface ChangePasswordModalProps {
    opened: boolean;
    onClose: () => void;
}

const initialValues = {
    new_password: '',
    re_new_password: '',
    current_password: '',
};

type FormValues = typeof initialValues;

function PasswordRequirement({ meets, label }: { meets: boolean; label: string }) {
    return (
        <Text c={meets ? 'teal' : 'red'} style={{ display: 'flex', alignItems: 'center' }} mt={7} size="sm">
            {meets ? <IconCheck size="0.9rem" /> : <IconX size="0.9rem" />} <Box ml={10}>{label}</Box>
        </Text>
    );
}

const requirements = [
    { re: /[0-9]/, label: 'Includes number' },
    { re: /[a-z]/, label: 'Includes lowercase letter' },
    { re: /[A-Z]/, label: 'Includes uppercase letter' },
    { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

function getStrength(password: string) {
    let multiplier = password.length > 7 ? 0 : 1;

    requirements.forEach((requirement) => {
        if (!requirement.re.test(password)) {
            multiplier += 1;
        }
    });

    return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 0);
}

export function ChangePasswordModal({ opened, onClose }: ChangePasswordModalProps) {
    const [popoverOpened, setPopoverOpened] = useState(false);
    const form = useForm({
        initialValues,
        validate: {
            new_password: (value: string) => (getStrength(value) === 100 ? null : 'Password does not meet all requirements'),
            re_new_password: (value: string, values: FormValues) => (value !== values.new_password ? 'Passwords did not match' : null),
        },
    });

    const checks = requirements.map((requirement, index) => (
        <PasswordRequirement key={index} label={requirement.label} meets={requirement.re.test(form.values.new_password)} />
    ));

    const strength = getStrength(form.values.new_password);
    const color = strength === 100 ? 'teal' : strength > 50 ? 'yellow' : 'red';

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
        <Modal opened={opened} onClose={onClose} title="Change Password" centered classNames={{ content: 'glass-card' }}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <PasswordInput
                    label="Current Password"
                    placeholder="Your current password"
                    required
                    {...form.getInputProps('current_password')}
                />
                 <Popover opened={popoverOpened} position="bottom" width="target" transitionProps={{ transition: 'pop' }}>
                    <Popover.Target>
                        <div
                            onFocusCapture={() => setPopoverOpened(true)}
                            onBlurCapture={() => setPopoverOpened(false)}
                        >
                            <PasswordInput
                                label="New Password"
                                placeholder="Your new password"
                                mt="md"
                                required
                                {...form.getInputProps('new_password')}
                            />
                        </div>
                    </Popover.Target>
                    <Popover.Dropdown>
                        <Progress color={color} value={strength} size={5} mb="xs" />
                        <PasswordRequirement label="Has at least 8 characters" meets={form.values.new_password.length > 7} />
                        {checks}
                    </Popover.Dropdown>
                </Popover>

                <PasswordInput
                    label="Confirm New Password"
                    placeholder="Confirm your new password"
                    mt="md"
                    required
                    {...form.getInputProps('re_new_password')}
                />
                <Group justify="flex-end" mt="xl">
                    <Button type="submit" color="violet">Change Password</Button>
                </Group>
            </form>
        </Modal>
    );
}
