import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Upload, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface MyHealthEUSyncProps {
  patientId: string;
}

export const MyHealthEUSync: React.FC<MyHealthEUSyncProps> = ({ patientId }) => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const { toast } = useToast();

  const syncMutation = useMutation({
    mutationFn: async (action: 'fetch' | 'push') => {
      const { data, error } = await supabase.functions.invoke('sync-myhealth-eu', {
        body: {
          action,
          patientId,
          countryCode: selectedCountry
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, action) => {
      toast({
        title: action === 'fetch' ? "Data Fetched" : "Data Pushed",
        description: action === 'fetch' 
          ? "Patient summary retrieved from MyHealth@EU"
          : `Synced ${data.synced_records} records to MyHealth@EU`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const euCountries = [
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'PT', name: 'Portugal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AT', name: 'Austria' },
    { code: 'SE', name: 'Sweden' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'EE', name: 'Estonia' },
    { code: 'BG', name: 'Bulgaria' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          MyHealth@EU Cross-Border Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Select Country:</Label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Choose EU member state" />
            </SelectTrigger>
            <SelectContent>
              {euCountries.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => syncMutation.mutate('fetch')}
            disabled={!selectedCountry || syncMutation.isPending}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Fetch Data
          </Button>
          <Button
            onClick={() => syncMutation.mutate('push')}
            disabled={!selectedCountry || syncMutation.isPending}
          >
            <Upload className="mr-2 h-4 w-4" />
            Push Data
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">EHDS Compliance Features:</h4>
          <div className="space-y-2">
            {[
              'Patient Summary (PS) exchange',
              'ePrescription (eP) cross-border',
              'Laboratory Results sharing',
              'Secure eHDSI infrastructure',
              'Consent management',
              'Real-time availability check'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>European Health Data Space:</strong> This integration enables
            seamless cross-border healthcare data exchange across EU member states,
            ensuring continuity of care when traveling or relocating.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
