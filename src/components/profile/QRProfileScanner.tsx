import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanLine, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

export const QRProfileScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (transferToken: string) => {
      const { data, error } = await supabase.functions.invoke('import-qr-profile', {
        body: { transferToken }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast({
        title: "Profile Imported",
        description: `Successfully imported ${data.imported.join(', ')}`,
      });
      setScanning(false);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
      setScanning(false);
    }
  });

  const startScan = () => {
    setScanning(true);
    // In production, integrate with device camera
    // For demo, simulate scan
    setTimeout(() => {
      const mockToken = 'demo-transfer-token-' + Date.now();
      importMutation.mutate(mockToken);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="h-5 w-5" />
          Scan QR Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!importResult ? (
          <>
            <div className="text-center space-y-4">
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                {scanning ? (
                  <div className="animate-pulse">
                    <ScanLine className="h-16 w-16 text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">Scanning...</p>
                  </div>
                ) : (
                  <div>
                    <ScanLine className="h-16 w-16 text-muted-foreground mx-auto" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Ready to scan QR code
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={startScan}
                disabled={scanning || importMutation.isPending}
                className="w-full"
              >
                {scanning ? 'Scanning...' : 'Start Scan'}
              </Button>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Point your camera at the QR code</p>
              <p>• Ensure good lighting for best results</p>
              <p>• The profile will be decrypted securely</p>
              <p>• You'll review data before importing</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Import Successful</p>
                <p className="text-sm text-green-700">
                  Profile type: {importResult.profile_type}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Imported Data:</p>
              {importResult.imported.map((item: string) => (
                <div key={item} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    {item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>

            <Button onClick={() => setImportResult(null)} variant="outline" className="w-full">
              Scan Another QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
