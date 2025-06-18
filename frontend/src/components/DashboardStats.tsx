import { useState, useEffect } from 'react';
import { Grid, Card, Text, Group, RingProgress, Center } from '@mantine/core';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axiosInstance from '../utils/axiosInstance';
import { IconCheck, IconClock, IconX, IconLoader, IconArrowBackUp } from '@tabler/icons-react';

interface StatsData {
    total_requests: number;
    completed: number;
    in_progress: number;
    pending_approval: number;
    awaiting_payment: number;
    rejected: number;
    withdrawn: number;
}

const COLORS = {
    completed: '#40C057', // green
    in_progress: '#228BE6', // blue
    pending_approval: '#FAB005', // yellow
    awaiting_payment: '#FD7E14', // orange
    rejected: '#FA5252', // red
    withdrawn: '#868E96', // gray
};

export function DashboardStats() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

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
        return <Group justify="center" mt="xl"><IconLoader className="animate-spin" /></Group>;
    }

    if (!stats || stats.total_requests === 0) {
        return (
            <Card withBorder radius="md" p="xl" mt="md">
                <Text ta="center" size="lg" fw={500}>No service requests yet!</Text>
                <Text ta="center" c="dimmed" mt="xs">Your dashboard will show stats here once you request a service.</Text>
            </Card>
        );
    }

    const pieData = [
        { name: 'Completed', value: stats.completed, color: COLORS.completed },
        { name: 'In Progress', value: stats.in_progress, color: COLORS.in_progress },
        { name: 'Pending Approval', value: stats.pending_approval, color: COLORS.pending_approval },
        { name: 'Awaiting Payment', value: stats.awaiting_payment, color: COLORS.awaiting_payment },
        { name: 'Rejected', value: stats.rejected, color: COLORS.rejected },
        { name: 'Withdrawn', value: stats.withdrawn, color: COLORS.withdrawn },
    ].filter(item => item.value > 0);

    return (
        <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                <Card withBorder radius="md" p="sm">
                    <Group>
                        <RingProgress
                            sections={[{ value: (stats.completed / stats.total_requests) * 100, color: 'teal' }]}
                            label={<Center><IconCheck size={22} /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Completed</Text>
                            <Text fw={700} size="xl">{stats.completed}</Text>
                        </div>
                    </Group>
                </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                <Card withBorder radius="md" p="sm">
                    <Group>
                         <RingProgress
                            sections={[{ value: (stats.in_progress / stats.total_requests) * 100, color: 'blue' }]}
                            label={<Center><IconClock size={22} /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>In Progress</Text>
                            <Text fw={700} size="xl">{stats.in_progress}</Text>
                        </div>
                    </Group>
                </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                <Card withBorder radius="md" p="sm">
                    <Group>
                         <RingProgress
                            sections={[{ value: (stats.pending_approval / stats.total_requests) * 100, color: 'yellow' }]}
                            label={<Center><IconLoader size={22} /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Pending</Text>
                            <Text fw={700} size="xl">{stats.pending_approval}</Text>
                        </div>
                    </Group>
                </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                <Card withBorder radius="md" p="sm">
                    <Group>
                         <RingProgress
                            sections={[{ value: (stats.awaiting_payment / stats.total_requests) * 100, color: 'orange' }]}
                            label={<Center><IconClock size={22} /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Awaiting Payment</Text>
                            <Text fw={700} size="xl">{stats.awaiting_payment}</Text>
                        </div>
                    </Group>
                </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                <Card withBorder radius="md" p="sm">
                    <Group>
                         <RingProgress
                            sections={[{ value: (stats.rejected / stats.total_requests) * 100, color: 'red' }]}
                            label={<Center><IconX size={22} /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Rejected</Text>
                            <Text fw={700} size="xl">{stats.rejected}</Text>
                        </div>
                    </Group>
                </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                <Card withBorder radius="md" p="sm">
                    <Group>
                         <RingProgress
                            sections={[{ value: (stats.withdrawn / stats.total_requests) * 100, color: 'gray' }]}
                            label={<Center><IconArrowBackUp size={22} /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Withdrawn</Text>
                            <Text fw={700} size="xl">{stats.withdrawn}</Text>
                        </div>
                    </Group>
                </Card>
            </Grid.Col>
            <Grid.Col span={12}>
                <Card withBorder radius="md" p="lg" style={{ height: 300 }}>
                    <Text fw={500} mb="lg">Service Request Statuses</Text>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </Grid.Col>
        </Grid>
    );
}
