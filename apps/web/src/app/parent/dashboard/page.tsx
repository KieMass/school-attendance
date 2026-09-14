'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import type { LeaveRequest } from '@/types';

export default function ParentDashboardPage() {
  const { data: pending, loading } = useApi<LeaveRequest[]>('/parents/leave-requests/pending');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <p className="text-muted-foreground">Review and respond to your child&apos;s leave requests.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Awaiting your response</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold text-warning">{pending?.length ?? 0}</CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Pending requests</CardTitle>
          <Link href="/parent/requests" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && pending?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing waiting on you right now.</p>
          )}
          {pending?.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="font-medium">
                  {r.student.firstName} {r.student.lastName} — {r.destination}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(r.departureTime)} → {formatDateTime(r.expectedReturnTime)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={r.status} />
                <Link href={`/parent/requests/${r.id}`} className={buttonVariants({ size: 'sm' })}>
                  Review
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
