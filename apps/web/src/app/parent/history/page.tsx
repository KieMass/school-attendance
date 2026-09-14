'use client';

import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { LeaveRequest, PaginatedResult } from '@/types';

export default function ParentHistoryPage() {
  const { data, loading } = useApi<PaginatedResult<LeaveRequest>>(
    '/parents/leave-requests/history?pageSize=50',
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Leave History</h1>
        <p className="text-muted-foreground">All past leave requests for your children.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Destination</th>
                <th className="py-2 pr-4">Leave date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Exit / Return</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {r.student.firstName} {r.student.lastName}
                  </td>
                  <td className="py-3 pr-4">{r.destination}</td>
                  <td className="py-3 pr-4">{formatDate(r.leaveDate)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {r.exitLog ? `Exited ${formatDateTime(r.exitLog.exitAt)}` : '—'}
                    {r.returnLog ? ` · Returned ${formatDateTime(r.returnLog.returnAt)}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && data?.items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
