'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { api, ApiError } from '@/lib/api-client';
import type { LeaveRequest } from '@/types';

export default function ParentRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, loading } = useApi<LeaveRequest>(`/parents/leave-requests/${params.id}`);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: 'approve' | 'reject') {
    setSubmitting(decision === 'approve' ? 'APPROVED' : 'REJECTED');
    setError(null);
    try {
      await api.post(`/parents/leave-requests/${params.id}/${decision}`, { comments });
      router.push('/parent/requests');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit decision.');
    } finally {
      setSubmitting(null);
    }
  }

  if (loading || !data) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const isPending = data.status === 'PENDING';

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {data.student.firstName} {data.student.lastName}
          </CardTitle>
          <StatusBadge status={data.status} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Student ID</dt>
              <dd className="font-medium">{data.student.studentIdCode}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Leave type</dt>
              <dd className="font-medium">{data.leaveType.replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Destination</dt>
              <dd className="font-medium">{data.destination}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Leave date</dt>
              <dd className="font-medium">{formatDate(data.leaveDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Departure</dt>
              <dd className="font-medium">{formatDateTime(data.departureTime)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expected return</dt>
              <dd className="font-medium">{formatDateTime(data.expectedReturnTime)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Reason</dt>
              <dd className="font-medium">{data.reason}</dd>
            </div>
            {data.additionalNotes && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Additional notes</dt>
                <dd className="font-medium">{data.additionalNotes}</dd>
              </div>
            )}
          </dl>

          {data.approvals.length > 0 && (
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="mb-1 font-medium">Decision history</p>
              {data.approvals.map((a) => (
                <p key={a.id} className="text-muted-foreground">
                  {a.parent.firstName} {a.parent.lastName} — {a.decision} ({formatDateTime(a.decidedAt)})
                  {a.comments ? `: "${a.comments}"` : ''}
                </p>
              ))}
            </div>
          )}

          {isPending && (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comments">Comments (optional)</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any notes for the school or student…"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3">
                <Button
                  variant="success"
                  disabled={!!submitting}
                  onClick={() => decide('approve')}
                  className="flex-1"
                >
                  {submitting === 'APPROVED' ? 'Approving…' : 'Approve'}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!!submitting}
                  onClick={() => decide('reject')}
                  className="flex-1"
                >
                  {submitting === 'REJECTED' ? 'Rejecting…' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
