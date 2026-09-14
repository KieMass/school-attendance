'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { LeaveRequest, LeaveRequestStatus } from '@/types';

export default function StaffLeaveRequestsPage() {
  const [status, setStatus] = useState<LeaveRequestStatus | ''>('');
  const { data, loading } = useApi<LeaveRequest[]>(
    `/staff/leave-requests${status ? `?status=${status}` : ''}`,
    [status],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground">School-wide view of all leave requests.</p>
        </div>
        <Select
          className="w-48"
          value={status}
          onChange={(e) => setStatus(e.target.value as LeaveRequestStatus | '')}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
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
              {data?.map((r) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
