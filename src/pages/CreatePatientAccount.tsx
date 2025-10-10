import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail, Phone, Calendar } from 'lucide-react';

interface PatientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
}

export default function CreatePatientAccount() {
  return (
    <ProtectedRoute>
      <CreatePatientAccountContent />
    </ProtectedRoute>
  );
}

function CreatePatientAccountContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PatientFormData>();

  const onSubmit = async (formData: PatientFormData) => {
    setIsLoading(true);

    try {
      // Get specialist ID if user is a specialist
      const { data: specialistData } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', profile?.id)
        .single();

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

      // Create auth user with edge function (since we can't create users directly from client)
      const { data: createUserData, error: createUserError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: tempPassword,
          user_metadata: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: 'patient',
            phone: formData.phone,
            date_of_birth: formData.date_of_birth
          }
        }
      });

      if (createUserError) {
        // If edge function doesn't exist, create profile directly and let user sign up later
        console.warn('Edge function not available, creating profile only:', createUserError);
        
        // Note: We can't create profiles directly without auth.users entry
        // Show message to user
        toast({
          title: 'Manual Setup Required',
          description: `Please have the patient sign up with email ${formData.email} to create their account.`,
          variant: 'default',
        });

        navigate('/specialist/patients');
        return;
      }

      // If user was created successfully, update the profile with specialist/clinic info
      if (createUserData?.user) {
        await supabase
          .from('profiles')
          .update({
            created_by_specialist_id: specialistData?.id,
          })
          .eq('id', createUserData.user.id);

        // Send welcome email with password reset link
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth`
        });

        if (resetError) console.error('Failed to send welcome email:', resetError);
      }

      toast({
        title: 'Patient Account Created',
        description: `Patient ${formData.first_name} ${formData.last_name} has been created. A welcome email has been sent.`,
      });

      navigate('/specialist/patients');
    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create patient account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Create Patient Account"
      description="Create a new patient account on behalf of the patient"
    >
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New Patient Registration
            </CardTitle>
            <CardDescription>
              Fill in the patient's information. They will receive a welcome email to set up their password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    {...register('first_name', { required: 'First name is required' })}
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    {...register('last_name', { required: 'Last name is required' })}
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register('date_of_birth')}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> After creating the account, the patient will receive a welcome email 
                  with instructions to set up their password. They can then log in using their email address.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
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
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Patient Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
