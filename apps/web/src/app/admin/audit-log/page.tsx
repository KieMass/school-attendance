'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils';

interface AuditEntry {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
  user?: { email: string | null; role: string } | null;
}

const ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'LEAVE_REQUEST_CREATED',
  'LEAVE_APPROVED',
  'LEAVE_REJECTED',
  'QR_GENERATED',
  'QR_SCANNED',
  'STUDENT_SIGNED_OUT',
  'STUDENT_SIGNED_IN',
  'USER_CREATED',
  'GUARDIAN_ASSIGNED',
  'POLICY_UPDATED',
];

export default function AdminAuditLogPage() {
  const [action, setAction] = useState('');
  const { data, loading } = useApi<{ items: AuditEntry[]; total: number }>(
    `/audit-log?pageSize=100${action ? `&action=${action}` : ''}`,
    [action],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">Immutable record of every security-relevant event.</p>
        </div>
        <Select className="w-56" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Timestamp</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2 pr-4">Actor</th>
                <th className="py-2 pr-4">Entity</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                  <td className="py-3 pr-4 font-medium">{e.action.replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {e.user ? `${e.user.email ?? ''} (${e.user.role})` : 'System'}
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {e.entityType ? `${e.entityType} #${e.entityId?.slice(0, 8)}` : '—'}
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
