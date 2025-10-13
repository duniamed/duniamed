import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScannedData {
  name: string;
  policyNumber: string;
  insurer: string;
  planType: string;
  validUntil: string;
  memberId?: string;
}

interface HealthCardScannerProps {
  onDataScanned: (data: ScannedData) => void;
}

export function HealthCardScanner({ onDataScanned }: HealthCardScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image under 10MB',
        variant: 'destructive',
      });
      return;
    }

    setScanning(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Image = reader.result?.toString().split(',')[1];
        
        if (!base64Image) {
          throw new Error('Failed to process image');
        }

        // Call Vision OCR function
        const { data, error } = await supabase.functions.invoke('scan-health-card-vision', {
          body: { 
            imageBase64: base64Image,
            cardSide: 'front'
          },
        });

        if (error) throw error;

        if (data?.fields) {
          const formatted: ScannedData = {
            name: data.fields.patientName?.value || '',
            policyNumber: data.fields.policyNumber?.value || '',
            insurer: data.fields.insurerName?.value || '',
            planType: 'Standard',
            validUntil: data.fields.expirationDate?.value || '',
            memberId: data.fields.memberId?.value || '',
          };
          
          // Show warnings if confidence is low
          if (data.overallConfidence < 85 || data.needsManualReview) {
            toast({
              title: 'Low Confidence Scan',
              description: 'Please review extracted data carefully',
              variant: 'default',
            });
          }
          
          setScannedData(formatted);
          onDataScanned(formatted);
          toast({
            title: 'Card Scanned Successfully',
            description: `Confidence: ${Math.round(data.overallConfidence)}%`,
          });
        } else {
          throw new Error('Failed to extract card information');
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };
    } catch (error: any) {
      toast({
        title: 'Scan Failed',
        description: error.message || 'Unable to scan health card',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Health Card Scanner
        </CardTitle>
        <CardDescription>
          Scan insurance card to auto-fill patient information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scannedData ? (
          <>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Position card within frame and tap to capture
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                size="lg"
              >
                {scanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning Card...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Scan Insurance Card
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              <p>Supports: SulAmérica, Unimed, Amil, Aetna, UnitedHealthcare, and more</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Card Scanned Successfully!</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Patient Name</Label>
                <Input value={scannedData.name} readOnly className="font-medium" />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Insurance Provider</Label>
                <Input value={scannedData.insurer} readOnly className="font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Policy Number</Label>
                  <Input value={scannedData.policyNumber} readOnly className="font-mono text-sm" />
                </div>
                {scannedData.memberId && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Member ID</Label>
                    <Input value={scannedData.memberId} readOnly className="font-mono text-sm" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Plan Type</Label>
                  <Input value={scannedData.planType} readOnly />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valid Until</Label>
                  <Input value={scannedData.validUntil} readOnly />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setScannedData(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="flex-1"
              >
                Scan Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}