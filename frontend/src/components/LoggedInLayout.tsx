import { AppShell, NavLink } from '@mantine/core';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { IconListCheck, IconUserCircle, IconLayoutDashboard, IconPlus } from '@tabler/icons-react';
import { Header } from './Header';

export function LoggedInLayout() {
    const location = useLocation();

    const navLinks = [
        { icon: IconLayoutDashboard, label: 'Home', path: '/dashboard' },
        { icon: IconListCheck, label: 'My Requests', path: '/my-requests' },
        { icon: IconPlus, label: 'Request a Service', path: '/request-service' },
        { icon: IconUserCircle, label: 'My Profile', path: '/profile' },
    ];

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 250, breakpoint: 'sm' }}
            padding="md"
        >
            <AppShell.Header>
                <Header />
            </AppShell.Header>

            <AppShell.Navbar p="xs">
                <AppShell.Section grow mt="md">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.label}
                            label={link.label}
                            leftSection={<link.icon size={16} />}
                            component={Link}
                            to={link.path}
                            active={location.pathname === link.path}
                            variant="filled"
                        />
                    ))}
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}
