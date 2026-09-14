'use client';

import { useState } from 'react';
import { Plus, Copy } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api-client';

interface ParentRow {
  id: string;
  firstName: string;
  lastName: string;
  relationship?: string | null;
  user: { email: string | null; phone: string | null };
  studentLinks: { student: { firstName: string; lastName: string } }[];
}

export default function AdminParentsPage() {
  const { data, loading, refetch } = useApi<{ items: ParentRow[]; total: number }>(
    '/admin/parents?pageSize=100',
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', phone: '', password: '', firstName: '', lastName: '', relationship: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function createParent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/admin/parents', form);
      setShowForm(false);
      setForm({ email: '', phone: '', password: '', firstName: '', lastName: '', relationship: '' });
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create parent.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Parents / Guardians</h1>
          <p className="text-muted-foreground">Manage parent accounts. Copy an id to assign a guardian on the Students page.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="mr-2 h-4 w-4" /> Add Parent
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Parent</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createParent} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </Field>
              <Field label="Last name">
                <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+592..." />
              </Field>
              <Field label="Relationship">
                <Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Mother / Father / Guardian" />
              </Field>
              <Field label="Temporary password">
                <Input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
              <Button type="submit" disabled={submitting} className="sm:col-span-2">
                {submitting ? 'Creating…' : 'Create parent'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All parents ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Children</th>
                <th className="py-2 pr-4">Parent ID</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {p.user.email ?? p.user.phone ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {p.studentLinks.length > 0
                      ? p.studentLinks.map((l) => `${l.student.firstName} ${l.student.lastName}`).join(', ')
                      : 'None'}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => navigator.clipboard.writeText(p.id)}
                    >
                      <Copy className="h-3 w-3" /> {p.id.slice(0, 8)}…
                    </button>
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
