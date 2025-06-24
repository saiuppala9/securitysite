import { AppShell, Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function LoggedInLayout() {
  return (
    <AppShell header={{ height: 70 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl">
            <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
