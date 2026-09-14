'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api-client';

interface Policy {
  qrTokenValidityMinutes: number;
  lateReturnGraceMinutes: number;
  requireDualApproval: boolean;
  allowWeekendLeaveOnly: boolean;
  maxAdvanceRequestDays: number;
}

export default function AdminPolicyPage() {
  const { data, loading } = useApi<Policy>('/admin/policy');
  const [form, setForm] = useState<Policy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await api.patch('/admin/policy', form);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save policy.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Leave Policy</CardTitle>
          <CardDescription>School-wide rules applied to every leave request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>QR gate-pass validity (minutes)</Label>
              <Input
                type="number"
                min={5}
                value={form.qrTokenValidityMinutes}
                onChange={(e) => setForm({ ...form, qrTokenValidityMinutes: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Late-return grace period (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={form.lateReturnGraceMinutes}
                onChange={(e) => setForm({ ...form, lateReturnGraceMinutes: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Maximum days in advance a request may be made</Label>
              <Input
                type="number"
                min={1}
                value={form.maxAdvanceRequestDays}
                onChange={(e) => setForm({ ...form, maxAdvanceRequestDays: Number(e.target.value) })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requireDualApproval}
                onChange={(e) => setForm({ ...form, requireDualApproval: e.target.checked })}
              />
              Require approval from every assigned guardian (not just one)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.allowWeekendLeaveOnly}
                onChange={(e) => setForm({ ...form, allowWeekendLeaveOnly: e.target.checked })}
              />
              Restrict leave requests to weekends only
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && <p className="text-sm text-success">Policy updated.</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save policy'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
