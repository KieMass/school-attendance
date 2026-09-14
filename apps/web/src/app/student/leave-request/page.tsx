'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api-client';
import type { LeaveType } from '@/types';

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'DAY_PASS', label: 'Day Pass' },
  { value: 'WEEKEND', label: 'Weekend Leave' },
  { value: 'MEDICAL', label: 'Medical Appointment' },
  { value: 'FAMILY_EMERGENCY', label: 'Family Emergency' },
  { value: 'OFFICIAL_SCHOOL_ACTIVITY', label: 'Official School Activity' },
  { value: 'OTHER', label: 'Other' },
];

export default function LeaveRequestPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    leaveType: 'DAY_PASS' as LeaveType,
    reason: '',
    destination: '',
    leaveDate: '',
    departureTime: '',
    expectedReturnTime: '',
    additionalNotes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/students/leave-requests', {
        ...form,
        departureTime: new Date(form.departureTime).toISOString(),
        expectedReturnTime: new Date(form.expectedReturnTime).toISOString(),
        leaveDate: new Date(form.leaveDate).toISOString(),
      });
      router.push('/student/status');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New Leave Request</CardTitle>
          <CardDescription>
            Your guardian will be notified immediately for approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leaveType">Leave type</Label>
              <Select
                id="leaveType"
                value={form.leaveType}
                onChange={(e) => update('leaveType', e.target.value as LeaveType)}
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                required
                value={form.destination}
                onChange={(e) => update('destination', e.target.value)}
                placeholder="e.g. Home — 12 Camp Street, Georgetown"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reason">Reason for leave</Label>
              <Textarea
                id="reason"
                required
                value={form.reason}
                onChange={(e) => update('reason', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leaveDate">Leave date</Label>
                <Input
                  id="leaveDate"
                  type="date"
                  required
                  value={form.leaveDate}
                  onChange={(e) => update('leaveDate', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="departureTime">Departure time</Label>
                <Input
                  id="departureTime"
                  type="datetime-local"
                  required
                  value={form.departureTime}
                  onChange={(e) => update('departureTime', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expectedReturnTime">Expected return</Label>
                <Input
                  id="expectedReturnTime"
                  type="datetime-local"
                  required
                  value={form.expectedReturnTime}
                  onChange={(e) => update('expectedReturnTime', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="additionalNotes">Additional notes (optional)</Label>
              <Textarea
                id="additionalNotes"
                value={form.additionalNotes}
                onChange={(e) => update('additionalNotes', e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
