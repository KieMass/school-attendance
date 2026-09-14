'use client';

import Link from 'next/link';
import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatDate, formatDateTime } from '@/lib/utils';
import { api, ApiError } from '@/lib/api-client';
import type { LeaveRequest, LeaveRequestStatus, PaginatedResult } from '@/types';

export default function StudentStatusPage() {
  const [status, setStatus] = useState<LeaveRequestStatus | ''>('');
  const { data, loading, refetch } = useApi<PaginatedResult<LeaveRequest>>(
    `/students/leave-requests${status ? `?status=${status}` : ''}`,
    [status],
  );

  async function cancelRequest(id: string) {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await api.post(`/students/leave-requests/${id}/cancel`);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to cancel request.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Leave Requests</h1>
          <p className="text-muted-foreground">Full history and current status.</p>
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
          <option value="EXPIRED">Expired</option>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Destination</th>
                <th className="py-2 pr-4">Leave date</th>
                <th className="py-2 pr-4">Departure → Return</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium">{r.destination}</td>
                  <td className="py-3 pr-4">{formatDate(r.leaveDate)}</td>
                  <td className="py-3 pr-4">
                    {formatDateTime(r.departureTime)} → {formatDateTime(r.expectedReturnTime)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      {r.status === 'APPROVED' && (
                        <Link
                          href={`/student/qr/${r.id}`}
                          className={buttonVariants({ size: 'sm', variant: 'outline' })}
                        >
                          <QrCode className="mr-1 h-4 w-4" /> QR
                        </Link>
                      )}
                      {r.status === 'PENDING' && (
                        <Button size="sm" variant="destructive" onClick={() => cancelRequest(r.id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && data?.items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No requests found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
