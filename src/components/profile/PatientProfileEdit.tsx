import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

export function PatientProfileEdit() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      date_of_birth: profile?.date_of_birth || '',
      blood_type: (profile as any)?.blood_type || '',
      insurance_provider: (profile as any)?.insurance_provider || '',
      insurance_id: (profile as any)?.insurance_id || '',
      emergency_contact_name: (profile as any)?.emergency_contact_name || '',
      emergency_contact_phone: (profile as any)?.emergency_contact_phone || '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', profile?.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Profile updated successfully' });
      await refreshProfile();
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input {...register('first_name')} required />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input {...register('last_name')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register('phone')} type="tel" />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input {...register('date_of_birth')} type="date" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Blood Type</Label>
            <Input {...register('blood_type')} placeholder="e.g., A+" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Insurance Provider</Label>
              <Input {...register('insurance_provider')} />
            </div>
            <div className="space-y-2">
              <Label>Insurance ID</Label>
              <Input {...register('insurance_id')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input {...register('emergency_contact_name')} />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input {...register('emergency_contact_phone')} type="tel" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
      </Button>
    </form>
  );
}
