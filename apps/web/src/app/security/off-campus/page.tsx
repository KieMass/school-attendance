'use client';

import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

interface OffCampusEntry {
  id: string;
  exitAt: string;
  status: 'EXITED' | 'OVERDUE';
  student: { firstName: string; lastName: string; studentIdCode: string };
  leaveRequest: { destination: string; expectedReturnTime: string };
}

export default function SecurityOffCampusPage() {
  const { data, loading } = useApi<OffCampusEntry[]>('/security/off-campus');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Students Off Campus</h1>
        <p className="text-muted-foreground">Live view of everyone currently signed out.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currently off campus ({data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Destination</th>
                <th className="py-2 pr-4">Exited</th>
                <th className="py-2 pr-4">Expected return</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {e.student.firstName} {e.student.lastName}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({e.student.studentIdCode})
                    </span>
                  </td>
                  <td className="py-3 pr-4">{e.leaveRequest.destination}</td>
                  <td className="py-3 pr-4">{formatDateTime(e.exitAt)}</td>
                  <td className="py-3 pr-4">{formatDateTime(e.leaveRequest.expectedReturnTime)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && data?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No students are currently off campus.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
