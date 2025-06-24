import { useState, useEffect } from 'react';
import { SimpleGrid, Paper, Text, Group, RingProgress, Center, useMantineTheme, Card, Loader } from '@mantine/core';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axiosInstance from '../utils/axiosInstance';
import { IconCheck, IconClock, IconX, IconLoader, IconArrowBackUp, IconHourglass } from '@tabler/icons-react';

interface StatsData {
    total_requests: number;
    completed: number;
    in_progress: number;
    pending_approval: number;
    awaiting_payment: number;
    rejected: number;
    withdrawn: number;
}

export function DashboardStats() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const theme = useMantineTheme();

    const glassStyle = {
        backgroundColor: 'rgba(10, 20, 40, 0.65)',
        backdropFilter: 'blur(10px) saturate(120%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white',
    };

    useEffect(() => {
        axiosInstance.get<StatsData>('/api/service-requests/stats/')
            .then(response => {
                setStats(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching stats:', error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <Group justify="center" mt="xl"><Loader size="xl" /></Group>;
    }

    if (!stats || stats.total_requests === 0) {
        return (
            <Card radius="md" p="xl" mt="md" style={glassStyle}>
                <Text ta="center" size="lg" fw={500}>No service requests yet!</Text>
                <Text ta="center" c="gray.3" mt="xs">Your dashboard will show stats here once you request a service.</Text>
            </Card>
        );
    }

    const COLORS: { [key: string]: string } = {
        Completed: theme.colors.green[6],
        'In Progress': theme.colors.blue[6],
        'Pending Approval': theme.colors.yellow[6],
        'Awaiting Payment': theme.colors.orange[6],
        Rejected: theme.colors.red[6],
        Withdrawn: theme.colors.gray[6],
    };

    const data = [
        { title: 'Completed', value: stats.completed, icon: IconCheck, color: 'green' },
        { title: 'In Progress', value: stats.in_progress, icon: IconHourglass, color: 'blue' },
        { title: 'Pending', value: stats.pending_approval, icon: IconClock, color: 'yellow' },
        { title: 'Awaiting Payment', value: stats.awaiting_payment, icon: IconClock, color: 'orange' },
        { title: 'Rejected', value: stats.rejected, icon: IconX, color: 'red' },
        { title: 'Withdrawn', value: stats.withdrawn, icon: IconArrowBackUp, color: 'gray' },
    ];

    const statCards = data.map((stat) => (
        <Paper radius="md" p="lg" key={stat.title} style={glassStyle}>
            <Group>
                <RingProgress
                    size={100}
                    thickness={10}
                    roundCaps
                    sections={[{ value: (stat.value / stats.total_requests) * 100, color: stat.color }]}
                    label={
                        <Center>
                            <stat.icon style={{ width: '2rem', height: '2rem' }} stroke={1.5} />
                        </Center>
                    }
                />
                <div>
                    <Text c="gray.3" size="md" tt="uppercase" fw={700}>{stat.title}</Text>
                    <Text fw={700} size="3rem">{stat.value}</Text>
                </div>
            </Group>
        </Paper>
    ));

    const pieData = [
        { name: 'Completed', value: stats.completed },
        { name: 'In Progress', value: stats.in_progress },
        { name: 'Pending Approval', value: stats.pending_approval },
        { name: 'Awaiting Payment', value: stats.awaiting_payment },
        { name: 'Rejected', value: stats.rejected },
        { name: 'Withdrawn', value: stats.withdrawn },
    ].filter(item => item.value > 0);

    return (
        <div>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mb="xl">
                {statCards}
            </SimpleGrid>
            <Paper radius="md" p="lg" style={{ ...glassStyle, height: 450 }}>
                <Text size="xl" fw={500} ta="center" mb="lg">Service Request Statuses</Text>
                <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label>
                            {pieData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />)}
                        </Pie>
                        <Tooltip contentStyle={glassStyle} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </Paper>
        </div>
    );
}
