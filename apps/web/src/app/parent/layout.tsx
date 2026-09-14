'use client';

import { LayoutDashboard, ClipboardCheck, History } from 'lucide-react';
import { RequireRole } from '@/components/require-role';
import { AppShell, type NavItem } from '@/components/app-shell';

const navItems: NavItem[] = [
  { href: '/parent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parent/requests', label: 'Pending Requests', icon: ClipboardCheck },
  { href: '/parent/history', label: 'History', icon: History },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['PARENT']}>
      <AppShell title="Parent Portal" navItems={navItems}>
        {children}
      </AppShell>
    </RequireRole>
  );
}
