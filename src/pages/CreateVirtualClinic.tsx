import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MEDICAL_SPECIALTIES } from '@/lib/constants/specialties';
import { Badge } from '@/components/ui/badge';

export default function CreateVirtualClinic() {
  return (
    <ProtectedRoute>
      <CreateVirtualClinicContent />
    </ProtectedRoute>
  );
}

function CreateVirtualClinicContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const { register, handleSubmit } = useForm();

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const onSubmit = async (formData: any) => {
    if (selectedSpecialties.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one specialty',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Create the virtual clinic
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .insert({
        created_by: profile?.id,
        name: formData.name,
        clinic_type: 'virtual',
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        specialties: selectedSpecialties,
        country: 'Virtual',
        is_active: true,
      })
      .select()
      .single();

    if (clinicError) {
      toast({
        title: 'Error',
        description: clinicError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Add creator as first staff member (admin)
    const { error: staffError } = await supabase
      .from('clinic_staff')
      .insert({
        clinic_id: clinicData.id,
        user_id: profile?.id,
        role: 'admin',
        permissions: { all: true },
        is_active: true,
      });

    if (staffError) {
      toast({
        title: 'Warning',
        description: 'Clinic created but failed to add you as staff. Please contact support.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Virtual clinic created successfully!',
      });
      navigate('/dashboard/clinic');
    }

    setIsLoading(false);
  };

  return (
    <DashboardLayout 
      title="Create Virtual Clinic"
      description="Start your own virtual healthcare practice and invite other specialists to join"
    >
      <div className="max-w-4xl space-y-6">

          <Card className="bg-soft-purple border-primary/20">
            <CardHeader>
              <CardTitle>What is a Virtual Clinic?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>A virtual clinic allows you to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Collaborate with specialists from around the world</li>
                <li>Share a patient queue and unified scheduling</li>
                <li>Build a collective brand and reputation</li>
                <li>Automatically manage revenue splitting</li>
                <li>Provide 24/7 coverage across time zones</li>
              </ul>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Global Family Medicine Collective"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    placeholder="Describe your virtual clinic's mission, approach, and what makes it unique..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Specialties Offered *</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select the specialties your virtual clinic will offer
                  </p>
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
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="contact@clinic.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    {...register('website')}
                    placeholder="https://your-clinic.com"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Virtual Clinic
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
    </DashboardLayout>
  );
}
