'use client';

import { useParams } from 'next/navigation';
import { Download, Printer } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

interface QrResponse {
  qrToken: { id: string; expiresAt: string; status: string };
  qrImageDataUrl: string;
}

export default function StudentQrPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useApi<QrResponse>(`/students/leave-requests/${params.id}/qr`);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6">
      <Card className="w-full print:border-none print:shadow-none">
        <CardHeader className="items-center text-center">
          <CardTitle>Gate Pass QR Code</CardTitle>
          <CardDescription>
            Present this code to the security officer at the gate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {data && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.qrImageDataUrl}
                alt="Leave pass QR code"
                className="h-64 w-64 rounded-md border border-border"
              />
              <p className="text-sm text-muted-foreground">
                Valid until {formatDateTime(data.qrToken.expiresAt)}
              </p>
              <div className="flex gap-3 print:hidden">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <a
                  href={data.qrImageDataUrl}
                  download={`gate-pass-${params.id}.png`}
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
