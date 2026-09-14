'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, ScanLine, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { api, ApiError } from '@/lib/api-client';

interface ScanResult {
  qrTokenId: string;
  leaveRequest: {
    id: string;
    destination: string;
    reason: string;
    expectedReturnTime: string;
  };
  student: {
    firstName: string;
    lastName: string;
    studentIdCode: string;
    dormitory?: string | null;
  };
  expiresAt: string;
}

/** Accepts input from a USB/Bluetooth barcode scanner (which types the QR
 * payload followed by Enter, just like a keyboard) or manual paste — no
 * camera/video dependency required for the gate kiosk. */
export default function SecurityScanPage() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSuccess(null);
    if (!content.trim()) return;
    try {
      const data = await api.post<ScanResult>('/security/scan', { content });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to validate QR code.');
    }
  }

  async function confirmSignOut() {
    setConfirming(true);
    setError(null);
    try {
      await api.post('/security/sign-out', { content, gateLocation: 'Main Gate' });
      setSuccess(`${result?.student.firstName} ${result?.student.lastName} signed out successfully.`);
      setResult(null);
      setContent('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign out student.');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Gate Pass</h1>
        <p className="text-muted-foreground">Scan the student&apos;s QR code to verify and sign them out.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" /> Scanner input
          </CardTitle>
          <CardDescription>
            Click into the field below, then scan with a handheld scanner (or paste the code manually).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="flex flex-col gap-3">
            <Label htmlFor="qr-content" className="sr-only">
              QR content
            </Label>
            <Input
              id="qr-content"
              ref={inputRef}
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Waiting for scan…"
            />
            <Button type="submit">Validate</Button>
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

      {result && (
        <Card className="border-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" /> Valid gate pass
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>
              <span className="font-medium">Student: </span>
              {result.student.firstName} {result.student.lastName} ({result.student.studentIdCode})
            </p>
            {result.student.dormitory && (
              <p>
                <span className="font-medium">Dormitory: </span>
                {result.student.dormitory}
              </p>
            )}
            <p>
              <span className="font-medium">Destination: </span>
              {result.leaveRequest.destination}
            </p>
            <p>
              <span className="font-medium">Expected return: </span>
              {formatDateTime(result.leaveRequest.expectedReturnTime)}
            </p>
            <p className="text-xs text-muted-foreground">
              Pass expires {formatDateTime(result.expiresAt)}
            </p>
            <Button onClick={confirmSignOut} disabled={confirming} className="mt-2">
              {confirming ? 'Signing out…' : 'Confirm sign-out'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
