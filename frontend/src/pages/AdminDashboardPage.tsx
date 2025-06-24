import { Container, Title, Paper, Skeleton, SimpleGrid, Text, Group, ThemeIcon } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { IconUsers, IconListCheck, IconChecks, IconArrowBackUp, IconX, IconAlertTriangle } from '@tabler/icons-react';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// Interfaces for the data
interface AdminStats {
  total_requests: number;
  completed: number;
  withdrawn: number;
  rejected: number;
  total_users: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

// Color mapping for pie chart
const STATUS_COLORS: { [key: string]: string } = {
  pending_approval: '#FAB005',
  awaiting_payment: '#FD7E14',
  in_progress: '#228BE6',
  completed: '#40C057',
  rejected: '#FA5252',
  cancelled: '#FA5252',
  withdrawn: '#868E96',
};

// StatCard component
function StatCard({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {title}
        </Text>
        <ThemeIcon color={color} variant="light" size={38} radius="md">
          <Icon size="1.8rem" stroke={1.5} />
        </ThemeIcon>
      </Group>
      <Text size="xl" fw={700} mt="sm">
        {value}
      </Text>
    </Paper>
  );
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statusData, setStatusData] = useState<StatusDistribution[]>([]);
  const [loading, setLoading] = useState(true);
    const isPartialAdmin = user?.groups?.includes('Partial Access Admin');

  useEffect(() => {
    const fetchStats = axiosInstance.get<AdminStats>('/api/admin/service-request-stats/');
    const fetchStatusDistribution = axiosInstance.get<StatusDistribution[]>('/api/admin/status-distribution/');

    Promise.all([fetchStats, fetchStatusDistribution])
      .then(([statsRes, statusRes]) => {
        setStats(statsRes.data);
        setStatusData(statusRes.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch dashboard data:', error);
        notifications.show({
          title: 'Error',
          message: 'Could not load dashboard data.',
          color: 'red',
        });
        setLoading(false);
      });
  }, []);

  const pieData = statusData.map((item: StatusDistribution) => ({
    name: item.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: item.count,
  }));

  if (loading) {
    return (
      <Container my="lg">
        <Title order={2} mb="xl">
          Admin Dashboard
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} mb="xl">
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </SimpleGrid>
        <Skeleton height={400} />
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container my="lg">
        <Title order={2} mb="xl">
          Admin Dashboard
        </Title>
        <Paper withBorder p="xl" radius="md" ta="center">
          <IconAlertTriangle size={48} stroke={1.5} />
          <Title order={3} mt="md">
            Could not load data
          </Title>
          <Text c="dimmed">
            There was an error fetching the dashboard statistics. Please try again later.
          </Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Container fluid my="lg" p="md">
      <Title order={2} mb="xl">
        Admin Dashboard
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: isPartialAdmin ? 4 : 5 }} mb="xl">
        {!isPartialAdmin && (
          <StatCard title="Total Users" value={stats.total_users} icon={IconUsers} color="gray" />
        )}
        <StatCard title="Total Requests (30d)" value={stats.total_requests} icon={IconListCheck} color="blue" />
        <StatCard title="Completed (30d)" value={stats.completed} icon={IconChecks} color="green" />
        <StatCard title="Rejected (30d)" value={stats.rejected} icon={IconX} color="red" />
        <StatCard title="Withdrawn (30d)" value={stats.withdrawn} icon={IconArrowBackUp} color="gray" />
      </SimpleGrid>

      <Paper withBorder p="md" radius="md" shadow="sm" style={{ height: 400 }}>
        <Text fw={500} mb="md" ta="center">
          {isPartialAdmin ? 'Your Service Requests by Status' : 'All Service Requests by Status'}
        </Text>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry: { name: string; value: number }, index: number) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase().replace(/ /g, '_')] || '#CCCCCC'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Text c="dimmed" ta="center">
            No service request data to display.
          </Text>
        )}
      </Paper>
    </Container>
  );
}
