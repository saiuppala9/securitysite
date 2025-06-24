import { Title, Container } from '@mantine/core';
import { DashboardStats } from '../components/DashboardStats';

export function DashboardPage() {
    return (
        <Container fluid my="xl">
            <Title order={2} ta="center" mb="xl">Dashboard</Title>
            <DashboardStats />
        </Container>
    );
}
