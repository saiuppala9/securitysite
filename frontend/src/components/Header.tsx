import {
  Container,
  Group,
  Button,
  Menu,
  Avatar,
  Text,
  Box,
  UnstyledButton,
  Image,
} from '@mantine/core';
import brandLogo from '../assets/brand.png';
import './Logo.css';
import { Link, NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import {
  IconLogout,
  IconUserCircle,
  IconLayoutDashboard,
  IconListCheck,
  IconPlus,
  IconChevronDown,
  IconClipboardList,
  IconTools,
  IconUsers,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  username?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_superuser?: boolean;
  groups?: string[];
}

const mainLinks = [
  { icon: IconLayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: IconListCheck, label: 'My Requests', path: '/my-requests' },
  { icon: IconPlus, label: 'Request Service', path: '/request-service' },
];

const adminLinks = [
  { icon: IconLayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: IconClipboardList, label: 'Requests', path: '/admin/requests' },
  { icon: IconTools, label: 'Services', path: '/admin/services' },
  { icon: IconUsers, label: 'Manage Admins', path: '/admin/manage-admins' },
];

export function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Check if we're on a protected route
      const isProtectedRoute = 
        window.location.pathname.startsWith('/dashboard') || 
        window.location.pathname.startsWith('/request-service') ||
        window.location.pathname.startsWith('/my-requests') ||
        window.location.pathname.startsWith('/profile') ||
        window.location.pathname.startsWith('/service-request');
      
      // If on protected route but no user data, redirect to login
      if (isProtectedRoute) {
        window.location.href = '/login';
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('authTokens');
    localStorage.removeItem('userData');
    setUser(null);
    
    // Redirect based on current path
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    window.location.href = isAdminRoute ? '/admin/login' : '/login';
  };

  const links = user?.is_staff ? adminLinks : mainLinks;

  const items = links.map((item) => (
    <Button
      key={item.label}
      component={RouterNavLink}
      to={item.path}
      variant="subtle"
      leftSection={<item.icon size={18} />}
      styles={(theme) => ({
        root: {
          color: theme.colors.dark[1],
          '&.active': {
            color: theme.colors.violet[6],
            backgroundColor: theme.colors.violet[0],
          },
        },
      })}
    >
      {item.label}
    </Button>
  ));

  const userMenu = user ? (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            <Avatar color="violet" radius="xl">
              {user.first_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
            </Avatar>
            <Box style={{ lineHeight: 1 }}>
              <Text size="sm" fw={500}>
                {user.first_name || user.email.split('@')[0]}
              </Text>
            </Box>
            <IconChevronDown size={14} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Application</Menu.Label>
        <Menu.Item
          leftSection={<IconUserCircle size={14} />}
          component={Link}
          to={user.is_staff ? "/admin/profile" : "/profile"}
        >
          My Profile
        </Menu.Item>
        {user.is_staff && (
          <Menu.Item
            leftSection={<IconLayoutDashboard size={14} />}
            component={Link}
            to="/admin/dashboard"
          >
            Admin Dashboard
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={14} />}
          onClick={handleLogout}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  ) : (
    <Group>
      <Button component={Link} to="/login" variant="default">
        Login
      </Button>
      <Button component={Link} to="/register">
        Register
      </Button>
    </Group>
  );

  return (
    <Box component="header" h="100%" style={{ borderBottom: '1px solid var(--mantine-color-dark-4)'}}>
      <Container size="xl" h="100%">
        <Group justify="space-between" h="100%">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Image src={brandLogo} h={65} w="auto" alt="Cyphex brand logo" className="brand-logo" />
          </Link>

          {user && <Group gap="xs">{items}</Group>}

          {userMenu}
        </Group>
      </Container>
    </Box>
  );
}
