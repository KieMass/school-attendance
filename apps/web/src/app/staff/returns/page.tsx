'use client';

import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

interface ReturnEntry {
  id: string;
  returnAt: string;
  wasLate: boolean;
  minutesLate?: number | null;
  student: { firstName: string; lastName: string; studentIdCode: string };
}

export default function StaffReturnsPage() {
  const { data, loading } = useApi<ReturnEntry[]>('/staff/returns/today');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Returns Today</h1>
        <p className="text-muted-foreground">Students who have returned to campus today.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returned ({data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Returned at</th>
                <th className="py-2 pr-4">On time?</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {r.student.firstName} {r.student.lastName}
                  </td>
                  <td className="py-3 pr-4">{formatDateTime(r.returnAt)}</td>
                  <td className="py-3 pr-4">
                    {r.wasLate ? (
                      <Badge variant="destructive">{r.minutesLate} min late</Badge>
                    ) : (
                      <Badge variant="success">On time</Badge>
                    )}
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
