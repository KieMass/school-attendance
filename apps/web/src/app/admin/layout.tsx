'use client';

import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCog,
  BarChart3,
  ScrollText,
  Settings,
} from 'lucide-react';
import { RequireRole } from '@/components/require-role';
import { AppShell, type NavItem } from '@/components/app-shell';

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: GraduationCap },
  { href: '/admin/parents', label: 'Parents', icon: Users },
  { href: '/admin/users', label: 'Staff & Accounts', icon: UserCog },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/policy', label: 'Policy', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['ADMIN']}>
      <AppShell title="Admin Console" navItems={navItems}>
        {children}
      </AppShell>
    </RequireRole>
  );
}
