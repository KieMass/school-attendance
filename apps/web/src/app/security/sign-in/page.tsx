'use client';

import { useState } from 'react';
import { CheckCircle2, LogIn, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { api, ApiError } from '@/lib/api-client';

interface ActiveExit {
  id: string;
  exitAt: string;
  student: { firstName: string; lastName: string; studentIdCode: string };
  leaveRequest: { destination: string; expectedReturnTime: string };
}

export default function SecuritySignInPage() {
  const [studentIdCode, setStudentIdCode] = useState('');
  const [exitLog, setExitLog] = useState<ActiveExit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExitLog(null);
    setSuccess(null);
    try {
      const data = await api.get<ActiveExit>(`/security/active-exit/${studentIdCode}`);
      setExitLog(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No active off-campus record found.');
    }
  }

  async function confirmSignIn() {
    if (!exitLog) return;
    setConfirming(true);
    setError(null);
    try {
      await api.post('/security/sign-in', { exitLogId: exitLog.id, gateLocation: 'Main Gate' });
      setSuccess(`${exitLog.student.firstName} ${exitLog.student.lastName} signed in successfully.`);
      setExitLog(null);
      setStudentIdCode('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign in student.');
    } finally {
      setConfirming(false);
    }
  }

  const isOverdue = exitLog && new Date() > new Date(exitLog.leaveRequest.expectedReturnTime);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Sign Student In</h1>
        <p className="text-muted-foreground">Look up by student ID to record their return to campus.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" /> Student lookup
          </CardTitle>
          <CardDescription>Enter the student ID printed on their school ID card.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={lookup} className="flex flex-col gap-3">
            <Label htmlFor="studentIdCode" className="sr-only">
              Student ID
            </Label>
            <Input
              id="studentIdCode"
              autoFocus
              value={studentIdCode}
              onChange={(e) => setStudentIdCode(e.target.value)}
              placeholder="e.g. PC-2026-0001"
            />
            <Button type="submit">Look up</Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-4 text-destructive">
            <XCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-success">
          <CardContent className="flex items-center gap-3 py-4 text-success">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>{success}</p>
          </CardContent>
        </Card>
      )}

      {exitLog && (
        <Card className={isOverdue ? 'border-destructive' : 'border-success'}>
          <CardHeader>
            <CardTitle>
              {exitLog.student.firstName} {exitLog.student.lastName} ({exitLog.student.studentIdCode})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>
              <span className="font-medium">Exited: </span>
              {formatDateTime(exitLog.exitAt)}
            </p>
            <p>
              <span className="font-medium">Destination: </span>
              {exitLog.leaveRequest.destination}
            </p>
            <p className={isOverdue ? 'font-medium text-destructive' : ''}>
              <span className="font-medium">Expected return: </span>
              {formatDateTime(exitLog.leaveRequest.expectedReturnTime)}
              {isOverdue ? ' (overdue)' : ''}
            </p>
            <Button onClick={confirmSignIn} disabled={confirming} className="mt-2">
              {confirming ? 'Signing in…' : 'Confirm sign-in'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
