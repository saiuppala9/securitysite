import { AppShell, Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import securityBg from '../assets/security.gif';
import { useEffect } from 'react';

export function LoggedInLayout() {
  
  useEffect(() => {
    // Check if user data exists in localStorage
    const userData = localStorage.getItem('userData');
    const authTokens = localStorage.getItem('authTokens');
    
    if (!userData || !authTokens) {
      // If no user data or tokens, redirect to login
      window.location.href = '/login';
    }
  }, []);
  
  return (
    <AppShell header={{ height: 70 }} padding="md">
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
        <Container size="xl">
            <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
