import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import { MEDICAL_SPECIALTIES } from '@/lib/constants/specialties';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ClinicProfileEdit() {
  return (
    <ProtectedRoute>
      <ClinicProfileEditContent />
    </ProtectedRoute>
  );
}

function ClinicProfileEditContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clinic, setClinic] = useState<any>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch } = useForm();

  useEffect(() => {
    fetchClinicData();
  }, []);

  const fetchClinicData = async () => {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('created_by', profile?.id)
      .single();

    if (data) {
      setClinic(data);
      setSelectedSpecialties(data.specialties || []);
      
      // Set form values
      Object.keys(data).forEach(key => {
        setValue(key, data[key]);
      });
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const onSubmit = async (formData: any) => {
    setIsLoading(true);

    const updates = {
      ...formData,
      specialties: selectedSpecialties,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('created_by', profile?.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Clinic profile has been updated successfully.',
      });
      fetchClinicData();
    }

    setIsLoading(false);
  };

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl py-8 px-4 mt-16">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Edit Clinic Profile</h1>
            <p className="text-muted-foreground">Update your clinic information</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic Name *</Label>
                  <Input id="name" {...register('name')} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_type">Clinic Type *</Label>
                  <Select
                    value={watch('clinic_type')}
                    onValueChange={(value) => setValue('clinic_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual Clinic</SelectItem>
                      <SelectItem value="physical">Physical Clinic</SelectItem>
                      <SelectItem value="hybrid">Hybrid (Virtual + Physical)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    placeholder="Describe your clinic, services, and what makes you unique..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Specialties Offered *</Label>
                  <div className="flex flex-wrap gap-2">
                    {MEDICAL_SPECIALTIES.map(specialty => (
                      <Badge
                        key={specialty}
                        variant={selectedSpecialties.includes(specialty) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {selectedSpecialties.includes(specialty) && <Check className="mr-1 h-3 w-3" />}
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active">Active Status</Label>
                    <p className="text-sm text-muted-foreground">Make clinic visible to patients</p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={watch('is_active')}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" {...register('email')} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" type="tel" {...register('phone')} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" type="url" {...register('website')} placeholder="https://" />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>Physical location (if applicable)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input id="address_line1" {...register('address_line1')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input id="address_line2" {...register('address_line2')} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register('city')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" {...register('state')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input id="postal_code" {...register('postal_code')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input id="country" {...register('country')} required />
                </div>
              </CardContent>
            </Card>

            {/* Legal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Legal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number</Label>
                    <Input id="license_number" {...register('license_number')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input id="tax_id" {...register('tax_id')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
