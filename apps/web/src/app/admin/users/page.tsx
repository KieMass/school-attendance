'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/lib/api-client';
import type { Role } from '@/types';

interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  staff?: { firstName: string; lastName: string; department?: string | null } | null;
  securityOfficer?: { firstName: string; lastName: string; badgeNumber: string } | null;
  admin?: { firstName: string; lastName: string } | null;
}

type CreatableRole = 'SECURITY' | 'STAFF' | 'ADMIN';

const ENDPOINT: Record<CreatableRole, string> = {
  SECURITY: '/admin/security-officers',
  STAFF: '/admin/staff',
  ADMIN: '/admin/admins',
};

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const { data, loading, refetch } = useApi<{ items: UserRow[]; total: number }>(
    `/admin/users?pageSize=100${roleFilter ? `&role=${roleFilter}` : ''}`,
    [roleFilter],
  );
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<CreatableRole>('SECURITY');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    badgeNumber: '',
    postLocation: '',
    department: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      };
      if (role === 'SECURITY') {
        payload.badgeNumber = form.badgeNumber;
        payload.postLocation = form.postLocation;
      }
      if (role === 'STAFF') payload.department = form.department;

      await api.post(ENDPOINT[role], payload);
      setShowForm(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', badgeNumber: '', postLocation: '', department: '' });
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(user: UserRow) {
    try {
      await api.patch(`/admin/users/${user.id}/${user.isActive ? 'deactivate' : 'activate'}`);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update account.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff & Accounts</h1>
          <p className="text-muted-foreground">Manage security officer, staff and administrator accounts.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAccount} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Role">
                <Select value={role} onChange={(e) => setRole(e.target.value as CreatableRole)}>
                  <option value="SECURITY">Security Officer</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Administrator</option>
                </Select>
              </Field>
              <Field label="Email">
                <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="First name">
                <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </Field>
              <Field label="Last name">
                <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </Field>
              {role === 'SECURITY' && (
                <>
                  <Field label="Badge number">
                    <Input required value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })} />
                  </Field>
                  <Field label="Post location">
                    <Input value={form.postLocation} onChange={(e) => setForm({ ...form, postLocation: e.target.value })} placeholder="Main Gate" />
                  </Field>
                </>
              )}
              {role === 'STAFF' && (
                <Field label="Department">
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </Field>
              )}
              <Field label="Temporary password">
                <Input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
              <Button type="submit" disabled={submitting} className="sm:col-span-2">
                {submitting ? 'Creating…' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>All accounts ({data?.total ?? 0})</CardTitle>
          <Select className="w-48" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | '')}>
            <option value="">All roles</option>
            <option value="STUDENT">Student</option>
            <option value="PARENT">Parent</option>
            <option value="SECURITY">Security</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((u) => {
                const name =
                  u.staff ?? u.securityOfficer ?? u.admin
                    ? `${(u.staff ?? u.securityOfficer ?? u.admin)!.firstName} ${(u.staff ?? u.securityOfficer ?? u.admin)!.lastName}`
                    : '—';
                return (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-medium">{name}</td>
                    <td className="py-3 pr-4">{u.role}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{u.email ?? u.phone ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.isActive ? 'success' : 'secondary'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
