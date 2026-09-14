'use client';

import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardCounts } from '@/types';

export default function StaffDashboardPage() {
  const { data } = useApi<DashboardCounts>('/staff/dashboard');

  const tiles = [
    { label: 'Pending approvals', value: data?.pending, color: 'text-warning' },
    { label: 'Approved requests', value: data?.approved, color: 'text-primary' },
    { label: 'Currently off campus', value: data?.offCampus, color: 'text-foreground' },
    { label: 'Overdue returns', value: data?.overdue, color: 'text-destructive' },
    { label: 'Returned today', value: data?.returnedToday, color: 'text-success' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">School-wide leave activity overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{tile.label}</CardTitle>
            </CardHeader>
            <CardContent className={`text-3xl font-bold ${tile.color}`}>
              {tile.value ?? '—'}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
