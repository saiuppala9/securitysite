import { AppShell, Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import securityBg from '../assets/security.gif';

export function AdminLayout() {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main
        style={{
          backgroundImage: `url(${securityBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <Container size="xl" mt="md">
            <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
