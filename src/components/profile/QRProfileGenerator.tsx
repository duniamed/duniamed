import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { QrCode, Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import QRCode from 'qrcode';

export const QRProfileGenerator: React.FC<{ profileType: string }> = ({ profileType }) => {
  const [includeData, setIncludeData] = useState<string[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-qr-profile', {
        body: {
          profileType,
          includeData
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      // Generate QR code image
      const qrString = data.qr_string;
      const qrUrl = await QRCode.toDataURL(qrString, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrDataUrl(qrUrl);

      toast({
        title: "QR Profile Generated",
        description: `Profile will expire on ${new Date(data.expires_at).toLocaleString()}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const dataOptions = profileType === 'patient' 
    ? ['medical_records', 'prescriptions', 'allergies', 'vitals']
    : profileType === 'specialist'
    ? ['credentials', 'specialties', 'availability']
    : ['clinic_data', 'staff', 'services'];

  const handleToggleData = (option: string) => {
    setIncludeData(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `profile-qr-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Generate QR Profile Transfer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Include Data (HIPAA/LGPD Encrypted):</Label>
          {dataOptions.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={option}
                checked={includeData.includes(option)}
                onCheckedChange={() => handleToggleData(option)}
              />
              <Label htmlFor={option} className="cursor-pointer">
                {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>

        {!qrDataUrl ? (
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate QR Code'}
          </Button>
        ) : (
          <>
            <div className="flex justify-center">
              <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
            </div>

            <div className="flex gap-3">
              <Button onClick={downloadQR} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Security Notice:</strong> This QR code contains encrypted profile data.
                It will expire in 24 hours. Only scan with trusted devices.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
