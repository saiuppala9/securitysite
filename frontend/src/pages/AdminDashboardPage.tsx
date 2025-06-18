import { Container, Title, Paper, Skeleton, SimpleGrid, Text, Group } from '@mantine/core';
import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface AdminStats {
  total_requests: number;
  approved: number;
  completed: number;
  total_users: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statusData, setStatusData] = useState<StatusDistribution[]>([]);

  useEffect(() => {
    const fetchStats = axiosInstance.get<AdminStats>('/api/admin/stats/');
    const fetchStatusData = axiosInstance.get<StatusDistribution[]>('/api/admin/status-distribution/');

    Promise.all([fetchStats, fetchStatusData])
      .then(([statsRes, statusRes]) => {
        setStats(statsRes.data);
        setStatusData(statusRes.data);
      })
      .catch(() => {
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch dashboard data.',
          color: 'red',
        });
      });
  }, []);

  const statCards = stats ? (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
      <Paper withBorder p="md" radius="md">
        <Text size="xl" fw={700}>{stats.total_users}</Text>
        <Text size="sm" c="dimmed">Total Users</Text>
      </Paper>
      <Paper withBorder p="md" radius="md">
        <Text size="xl" fw={700}>{stats.total_requests}</Text>
        <Text size="sm" c="dimmed">Total Requests (30d)</Text>
      </Paper>
      <Paper withBorder p="md" radius="md">
        <Text size="xl" fw={700}>{stats.approved}</Text>
        <Text size="sm" c="dimmed">Approved (30d)</Text>
      </Paper>
      <Paper withBorder p="md" radius="md">
        <Text size="xl" fw={700}>{stats.completed}</Text>
        <Text size="sm" c="dimmed">Completed (30d)</Text>
      </Paper>
    </SimpleGrid>
  ) : (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
      <Skeleton height={80} /><Skeleton height={80} /><Skeleton height={80} /><Skeleton height={80} />
    </SimpleGrid>
  );

  const pieChartData = statusData.map(item => ({ name: item.status.replace(/_/g, ' ').toUpperCase(), value: item.count }));

  return (
    <Container fluid>
      <Title order={2} mb="xl">Admin Dashboard</Title>
      {statCards}
      <Paper withBorder p="md" radius="md" shadow="sm" style={{ height: 400 }}>
        <Text fw={500} mb="md" ta="center">All Service Requests by Status</Text>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" label>
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : <Skeleton height={350} />}
      </Paper>
    </Container>
  );
}

