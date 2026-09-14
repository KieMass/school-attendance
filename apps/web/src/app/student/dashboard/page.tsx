'use client';

import Link from 'next/link';
import { QrCode } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import type { LeaveRequest, PaginatedResult } from '@/types';

export default function StudentDashboardPage() {
  const { data, loading } = useApi<PaginatedResult<LeaveRequest>>(
    '/students/leave-requests?pageSize=5',
  );

  const counts = {
    pending: data?.items.filter((r) => r.status === 'PENDING').length ?? 0,
    approved: data?.items.filter((r) => r.status === 'APPROVED').length ?? 0,
    total: data?.total ?? 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Track your leave requests and gate passes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{counts.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-success">{counts.approved}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total requests</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{counts.total}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent requests</CardTitle>
          <Link href="/student/status" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && data?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
          )}
          {data?.items.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div>
                <p className="font-medium">{r.destination}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(r.departureTime)} → {formatDateTime(r.expectedReturnTime)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={r.status} />
                {r.status === 'APPROVED' && (
                  <Link
                    href={`/student/qr/${r.id}`}
                    className={buttonVariants({ size: 'sm', variant: 'outline' })}
                  >
                    <QrCode className="mr-1 h-4 w-4" /> QR
                  </Link>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
