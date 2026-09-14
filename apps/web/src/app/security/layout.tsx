'use client';

import { ScanLine, LogIn, Users } from 'lucide-react';
import { RequireRole } from '@/components/require-role';
import { AppShell, type NavItem } from '@/components/app-shell';

const navItems: NavItem[] = [
  { href: '/security/scan', label: 'Scan & Sign Out', icon: ScanLine },
  { href: '/security/sign-in', label: 'Sign In', icon: LogIn },
  { href: '/security/off-campus', label: 'Off Campus', icon: Users },
];

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['SECURITY']}>
      <AppShell title="Security Portal" navItems={navItems}>
        {children}
      </AppShell>
    </RequireRole>
  );
}
