import React from 'react';
import { Container, Title, Text, Paper, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export function PaymentFailurePage() {
    return (
        <Container my="xl">
            <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ textAlign: 'center' }}>
                <IconAlertCircle size={80} color="red" style={{ margin: 'auto' }} />
                <Title ta="center" mt="xl">Payment Failed</Title>
                <Text c="dimmed" ta="center" mt="sm">
                    Unfortunately, we were unable to process your payment. Please try again or contact support if the problem persists.
                </Text>
                <Button component={Link} to="/my-requests" mt="xl">
                    Return to My Requests
                </Button>
            </Paper>
        </Container>
    );
}
