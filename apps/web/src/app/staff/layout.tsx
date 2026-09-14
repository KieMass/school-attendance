'use client';

import { LayoutDashboard, ClipboardList, Users, CornerDownLeft } from 'lucide-react';
import { RequireRole } from '@/components/require-role';
import { AppShell, type NavItem } from '@/components/app-shell';

const navItems: NavItem[] = [
  { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/staff/leave-requests', label: 'Leave Requests', icon: ClipboardList },
  { href: '/staff/off-campus', label: 'Off Campus', icon: Users },
  { href: '/staff/returns', label: 'Returns Today', icon: CornerDownLeft },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['STAFF', 'ADMIN']}>
      <AppShell title="Staff Portal" navItems={navItems}>
        {children}
      </AppShell>
    </RequireRole>
  );
}
