import { AppShell, Burger, Group, NavLink, Button, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconGauge, IconActivity, IconCircleOff, IconUsers, IconUser } from '@tabler/icons-react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { icon: IconGauge, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: IconUser, label: 'Profile', path: '/admin/profile' },
  { icon: IconActivity, label: 'Service Requests', path: '/admin/requests' },
  { icon: IconCircleOff, label: 'Service Management', path: '/admin/services' },
  { icon: IconUsers, label: 'Manage Admins', path: '/admin/manage-admins' },
];

export function AdminLayout() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  console.log('Current user in AdminLayout:', user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

      const visibleLinks = user?.groups?.includes('Partial Access Admin')
    ? navLinks.filter(link => link.label === 'Dashboard' || link.label === 'Service Requests' || link.label === 'Profile')
    : navLinks;

  const items = visibleLinks.map((item) => (
    <NavLink
      key={item.label}
      label={item.label}
      leftSection={<item.icon size="1rem" stroke={1.5} />}
      component={Link}
      to={item.path}
      active={location.pathname === item.path}
    />
  ));

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <div>Cyphex Admin Portal</div>
          </Group>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack justify="space-between" style={{ height: '100%' }}>
          <div>{items}</div>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
