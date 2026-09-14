'use client';

import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api-client';

interface StudentRow {
  id: string;
  studentIdCode: string;
  firstName: string;
  lastName: string;
  dormitory?: string | null;
  gradeLevel?: string | null;
  user: { email: string | null };
  guardianLinks: { parent: { id: string; firstName: string; lastName: string } }[];
}

export default function AdminStudentsPage() {
  const { data, loading, refetch } = useApi<{ items: StudentRow[]; total: number }>(
    '/admin/students?pageSize=100',
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    studentIdCode: '',
    firstName: '',
    lastName: '',
    dormitory: '',
    gradeLevel: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [guardianForm, setGuardianForm] = useState<{ studentId: string; parentId: string } | null>(
    null,
  );

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/admin/students', form);
      setShowForm(false);
      setForm({ email: '', password: '', studentIdCode: '', firstName: '', lastName: '', dormitory: '', gradeLevel: '' });
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create student.');
    } finally {
      setSubmitting(false);
    }
  }

  async function assignGuardian(e: React.FormEvent) {
    e.preventDefault();
    if (!guardianForm) return;
    try {
      await api.post(`/admin/students/${guardianForm.studentId}/guardians`, {
        parentId: guardianForm.parentId,
        canApprove: true,
      });
      setGuardianForm(null);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to assign guardian.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student accounts and their assigned guardians.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createStudent} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Student ID">
                <Input required value={form.studentIdCode} onChange={(e) => setForm({ ...form, studentIdCode: e.target.value })} />
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
              <Field label="Dormitory">
                <Input value={form.dormitory} onChange={(e) => setForm({ ...form, dormitory: e.target.value })} />
              </Field>
              <Field label="Grade level">
                <Input value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} />
              </Field>
              <Field label="Temporary password">
                <Input
                  type="text"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </Field>
              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
              <Button type="submit" disabled={submitting} className="sm:col-span-2">
                {submitting ? 'Creating…' : 'Create student'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {guardianForm && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Guardian</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={assignGuardian} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Parent ID">
                <Input
                  required
                  placeholder="Paste parent id from the Parents page"
                  value={guardianForm.parentId}
                  onChange={(e) => setGuardianForm({ ...guardianForm, parentId: e.target.value })}
                />
              </Field>
              <Button type="submit">Assign</Button>
              <Button type="button" variant="ghost" onClick={() => setGuardianForm(null)}>
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All students ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Student ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Dormitory</th>
                <th className="py-2 pr-4">Guardians</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium">{s.studentIdCode}</td>
                  <td className="py-3 pr-4">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="py-3 pr-4">{s.dormitory ?? '—'}</td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {s.guardianLinks.length > 0
                      ? s.guardianLinks.map((g) => `${g.parent.firstName} ${g.parent.lastName}`).join(', ')
                      : 'None assigned'}
                  </td>
                  <td className="py-3 pr-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setGuardianForm({ studentId: s.id, parentId: '' })}
                    >
                      <UserPlus className="mr-1 h-4 w-4" /> Assign guardian
                    </Button>
                  </td>
                </tr>
              ))}
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
