import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { Container, Title, Text, Button, Paper, Center, Loader } from '@mantine/core';



const ActivationPage: React.FC = () => {
    const { uid, token } = useParams<{ uid: string; token: string }>();
    const [status, setStatus] = useState<'activating' | 'success' | 'error'>('activating');
    const [message, setMessage] = useState('Activating your account...');

    useEffect(() => {
        const activateAccount = async () => {
            if (!uid || !token) {
                setStatus('error');
                setMessage('Invalid activation link. The URL is missing required parameters.');
                return;
            }

            try {
                await axiosInstance.post('/auth/users/activation/', { uid, token });
                setStatus('success');
                setMessage('Your account has been successfully activated! You can now log in.');
            } catch (error) {
                setStatus('error');
                setMessage('Activation failed. The link may be expired or invalid. Please try registering again.');
                console.error('Activation error:', error);
            }
        };

        activateAccount();
    }, [uid, token]);

    return (
        <Container size={420} my={40}>
            <Title ta="center">Account Activation</Title>
            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <Center>
                    {status === 'activating' && <Loader />}
                </Center>
                <Center>
                    <Text>{message}</Text>
                </Center>
                {status === 'success' && (
                    <Button component={Link} to="/login" fullWidth mt="xl">
                        Go to Login
                    </Button>
                )}
                {status === 'error' && (
                     <Button component={Link} to="/register" fullWidth mt="xl">
                        Go to Registration
                    </Button>
                )}
            </Paper>
        </Container>
    );
};

export default ActivationPage;
