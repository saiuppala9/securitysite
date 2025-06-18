import { Group, Button, Title, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <Group justify="space-between" h="100%" px="md">
      <div style={{ flexGrow: 1, textAlign: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Title order={2} style={{ marginBottom: '0.1rem' }}>
            Cyphex
          </Title>
          <Text size="xs" c="dimmed">
            – Protecting What Matters Most
          </Text>
        </Link>
      </div>
      <Group>
        {user ? (
          <>
            <Text>Welcome, {user.first_name || user.username}</Text>
            {user.is_staff && (
              <Button component={Link} to="/admin" variant="filled" color="red">
                Admin
              </Button>
            )}

            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button component={Link} to="/login" variant="default">
              Login
            </Button>
            <Button component={Link} to="/register">
              Register
            </Button>
          </>
        )}
      </Group>
    </Group>
  );
}
