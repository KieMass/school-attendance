'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import type { LeaveRequest } from '@/types';

export default function ParentPendingRequestsPage() {
  const { data, loading } = useApi<LeaveRequest[]>('/parents/leave-requests/pending');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Requests</h1>
        <p className="text-muted-foreground">Approve or reject each request, with an optional comment.</p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && data?.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No pending leave requests.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data?.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle>
                {r.student.firstName} {r.student.lastName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{r.student.studentIdCode}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p>
                <span className="font-medium">Destination: </span>
                {r.destination}
              </p>
              <p>
                <span className="font-medium">Reason: </span>
                {r.reason}
              </p>
              <p>
                <span className="font-medium">Leave date: </span>
                {formatDate(r.leaveDate)}
              </p>
              <p>
                <span className="font-medium">Departure → Return: </span>
                {formatDateTime(r.departureTime)} → {formatDateTime(r.expectedReturnTime)}
              </p>
              <Link
                href={`/parent/requests/${r.id}`}
                className={cn(buttonVariants({ size: 'sm' }), 'mt-2 self-start')}
              >
                Review & respond
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
