import { Title } from '@mantine/core';
import { DashboardStats } from '../components/DashboardStats';

export function DashboardPage() {
    return (
        <>
            <Title order={2} mb="lg">Dashboard</Title>
            <DashboardStats />
        </>
    );
}
