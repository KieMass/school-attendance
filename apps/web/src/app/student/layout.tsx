'use client';

import { LayoutDashboard, FilePlus, ListChecks } from 'lucide-react';
import { RequireRole } from '@/components/require-role';
import { AppShell, type NavItem } from '@/components/app-shell';

const navItems: NavItem[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/leave-request', label: 'New Leave Request', icon: FilePlus },
  { href: '/student/status', label: 'My Requests', icon: ListChecks },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['STUDENT']}>
      <AppShell title="Student Portal" navItems={navItems}>
        {children}
      </AppShell>
    </RequireRole>
  );
}
