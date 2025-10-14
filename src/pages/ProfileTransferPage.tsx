import React from 'react';
import { QRProfileGenerator } from '@/components/profile/QRProfileGenerator';
import { QRProfileScanner } from '@/components/profile/QRProfileScanner';
import { FHIRExporter } from '@/components/interoperability/FHIRExporter';
import { MyHealthEUSync } from '@/components/interoperability/MyHealthEUSync';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ProfileTransferPage: React.FC = () => {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const profileType = profile?.role || 'patient';

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Transfer & Interoperability</h1>
        <p className="text-muted-foreground">
          Securely transfer profiles and exchange health data across borders
        </p>
      </div>

      <Tabs defaultValue="qr-generate" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="qr-generate">Generate QR</TabsTrigger>
          <TabsTrigger value="qr-scan">Scan QR</TabsTrigger>
          <TabsTrigger value="fhir">FHIR Export</TabsTrigger>
          <TabsTrigger value="myhealth">MyHealth@EU</TabsTrigger>
        </TabsList>

        <TabsContent value="qr-generate" className="space-y-6">
          <QRProfileGenerator profileType={profileType} />
        </TabsContent>

        <TabsContent value="qr-scan" className="space-y-6">
          <QRProfileScanner />
        </TabsContent>

        <TabsContent value="fhir" className="space-y-6">
          <FHIRExporter patientId={user?.id || ''} />
        </TabsContent>

        <TabsContent value="myhealth" className="space-y-6">
          <MyHealthEUSync patientId={user?.id || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTransferPage;
