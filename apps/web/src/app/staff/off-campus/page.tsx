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
  securityOfficer: { firstName: string; lastName: string };
}

export default function StaffOffCampusPage() {
  const { data, loading } = useApi<OffCampusEntry[]>('/staff/off-campus');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Students Off Campus</h1>
        <p className="text-muted-foreground">Monitor everyone currently away from school.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Off campus ({data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Destination</th>
                <th className="py-2 pr-4">Exited</th>
                <th className="py-2 pr-4">Expected return</th>
                <th className="py-2 pr-4">Signed out by</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {e.student.firstName} {e.student.lastName}
                  </td>
                  <td className="py-3 pr-4">{e.leaveRequest.destination}</td>
                  <td className="py-3 pr-4">{formatDateTime(e.exitAt)}</td>
                  <td className="py-3 pr-4">{formatDateTime(e.leaveRequest.expectedReturnTime)}</td>
                  <td className="py-3 pr-4">
                    {e.securityOfficer.firstName} {e.securityOfficer.lastName}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={e.status} />
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
