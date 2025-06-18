import React from 'react';
import { Container, Title, Text, Paper, Button } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export function PaymentSuccessPage() {
    return (
        <Container my="xl">
            <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ textAlign: 'center' }}>
                <IconCircleCheck size={80} color="green" style={{ margin: 'auto' }} />
                <Title ta="center" mt="xl">Payment Successful!</Title>
                <Text c="dimmed" ta="center" mt="sm">
                    Your payment has been processed successfully. Your service request is now in progress.
                </Text>
                <Button component={Link} to="/my-requests" mt="xl">
                    Go to My Requests
                </Button>
            </Paper>
        </Container>
    );
}
