'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardCounts } from '@/types';

interface ExitEntry {
  exitAt: string;
  returnLog?: { wasLate: boolean } | null;
}

export default function AdminDashboardPage() {
  const { data: counts } = useApi<DashboardCounts>('/staff/dashboard');
  const { data: weekly } = useApi<ExitEntry[]>('/admin/reports/weekly-exits');

  const chartData = buildWeeklyChart(weekly ?? []);

  const tiles = [
    { label: 'Pending approvals', value: counts?.pending, color: 'text-warning' },
    { label: 'Approved requests', value: counts?.approved, color: 'text-primary' },
    { label: 'Currently off campus', value: counts?.offCampus, color: 'text-foreground' },
    { label: 'Overdue returns', value: counts?.overdue, color: 'text-destructive' },
    { label: 'Returned today', value: counts?.returnedToday, color: 'text-success' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">School-wide leave activity at a glance.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Exits this week</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="exits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function buildWeeklyChart(entries: ExitEntry[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = new Array(7).fill(0);
  for (const entry of entries) {
    const dayIndex = new Date(entry.exitAt).getDay();
    counts[dayIndex] += 1;
  }
  return days.map((day, i) => ({ day, exits: counts[i] }));
}
