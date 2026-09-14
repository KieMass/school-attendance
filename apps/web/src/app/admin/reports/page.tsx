'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';

interface ExitReportEntry {
  id: string;
  exitAt: string;
  gateLocation?: string | null;
  student: { firstName: string; lastName: string; studentIdCode: string };
  leaveRequest: { destination: string };
  returnLog?: { returnAt: string; wasLate: boolean } | null;
}

interface LateReturnEntry {
  id: string;
  returnAt: string;
  minutesLate?: number | null;
  student: { firstName: string; lastName: string };
}

export default function AdminReportsPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data: dailyExits, loading: loadingDaily } = useApi<ExitReportEntry[]>(
    `/admin/reports/daily-exits?date=${date}`,
    [date],
  );
  const { data: lateReturns, loading: loadingLate } = useApi<LateReturnEntry[]>(
    '/admin/reports/late-returns',
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Daily exits and late-return trends.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Daily exits ({dailyExits?.length ?? 0})</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="report-date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="report-date"
              type="date"
              className="w-40"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loadingDaily && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Destination</th>
                <th className="py-2 pr-4">Exit time</th>
                <th className="py-2 pr-4">Return</th>
              </tr>
            </thead>
            <tbody>
              {dailyExits?.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {e.student.firstName} {e.student.lastName}
                  </td>
                  <td className="py-3 pr-4">{e.leaveRequest.destination}</td>
                  <td className="py-3 pr-4">{formatDateTime(e.exitAt)}</td>
                  <td className="py-3 pr-4">
                    {e.returnLog ? (
                      <span className={e.returnLog.wasLate ? 'text-destructive' : 'text-success'}>
                        {formatDateTime(e.returnLog.returnAt)}
                      </span>
                    ) : (
                      <Badge variant="warning">Still out</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loadingDaily && dailyExits?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No exits recorded on {formatDate(date)}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Late returns (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loadingLate && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Returned</th>
                <th className="py-2 pr-4">Minutes late</th>
              </tr>
            </thead>
            <tbody>
              {lateReturns?.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {r.student.firstName} {r.student.lastName}
                  </td>
                  <td className="py-3 pr-4">{formatDateTime(r.returnAt)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="destructive">{r.minutesLate} min</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loadingLate && lateReturns?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No late returns. 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
