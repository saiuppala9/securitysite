import { AppShell, Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function AdminLayout() {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl" mt="md">
            <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
