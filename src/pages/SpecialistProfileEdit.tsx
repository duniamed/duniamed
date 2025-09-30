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
import { Loader2, Save, Check, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import { MEDICAL_SPECIALTIES } from '@/lib/constants/specialties';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function SpecialistProfileEdit() {
  return (
    <ProtectedRoute>
      <SpecialistProfileEditContent />
    </ProtectedRoute>
  );
}

function SpecialistProfileEditContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [specialist, setSpecialist] = useState<any>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch } = useForm();

  useEffect(() => {
    fetchSpecialistData();
  }, []);

  const fetchSpecialistData = async () => {
    const { data, error } = await supabase
      .from('specialists')
      .select('*')
      .eq('user_id', profile?.id)
      .single();

    if (data) {
      setSpecialist(data);
      setSelectedSpecialties(data.specialty || []);
      setSelectedLanguages(data.languages || []);
      
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

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const onSubmit = async (formData: any) => {
    setIsLoading(true);

    const updates = {
      ...formData,
      specialty: selectedSpecialties,
      languages: selectedLanguages,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('specialists')
      .update(updates)
      .eq('user_id', profile?.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Your profile has been updated successfully.',
      });
      fetchSpecialistData();
    }

    setIsLoading(false);
  };

  const languages = ['English', 'Spanish', 'Portuguese', 'French', 'German', 'Italian', 'Arabic', 'Chinese', 'Japanese'];

  if (!specialist) {
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
            <h1 className="text-3xl font-bold">Edit Specialist Profile</h1>
            <p className="text-muted-foreground">Update your professional information</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Availability Toggle */}
            <Card>
              <CardHeader>
                <CardTitle>Availability Status</CardTitle>
                <CardDescription>Control your online status and patient acceptance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_online">Online Status</Label>
                    <p className="text-sm text-muted-foreground">Show as available for instant consultations</p>
                  </div>
                  <Switch
                    id="is_online"
                    checked={watch('is_online')}
                    onCheckedChange={(checked) => setValue('is_online', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_accepting_patients">Accepting New Patients</Label>
                    <p className="text-sm text-muted-foreground">Allow new patients to book appointments</p>
                  </div>
                  <Switch
                    id="is_accepting_patients"
                    checked={watch('is_accepting_patients')}
                    onCheckedChange={(checked) => setValue('is_accepting_patients', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="video_consultation_enabled">Video Consultations</Label>
                    <p className="text-sm text-muted-foreground">Enable virtual video consultations</p>
                  </div>
                  <Switch
                    id="video_consultation_enabled"
                    checked={watch('video_consultation_enabled')}
                    onCheckedChange={(checked) => setValue('video_consultation_enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="in_person_enabled">In-Person Consultations</Label>
                    <p className="text-sm text-muted-foreground">Accept in-person appointments</p>
                  </div>
                  <Switch
                    id="in_person_enabled"
                    checked={watch('in_person_enabled')}
                    onCheckedChange={(checked) => setValue('in_person_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Specialties *</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number *</Label>
                    <Input id="license_number" {...register('license_number')} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_country">License Country *</Label>
                    <Input id="license_country" {...register('license_country')} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="years_experience">Years of Experience</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      {...register('years_experience', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical_school">Medical School</Label>
                    <Input id="medical_school" {...register('medical_school')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio *</Label>
                  <Textarea
                    id="bio"
                    {...register('bio')}
                    rows={5}
                    placeholder="Tell patients about your experience, approach, and areas of expertise..."
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {languages.map(language => (
                    <Badge
                      key={language}
                      variant={selectedLanguages.includes(language) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleLanguage(language)}
                    >
                      {selectedLanguages.includes(language) && <Check className="mr-1 h-3 w-3" />}
                      {language}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Consultation Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Consultation Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consultation_fee_min">Minimum Fee</Label>
                    <Input
                      id="consultation_fee_min"
                      type="number"
                      step="0.01"
                      {...register('consultation_fee_min', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultation_fee_max">Maximum Fee</Label>
                    <Input
                      id="consultation_fee_max"
                      type="number"
                      step="0.01"
                      {...register('consultation_fee_max', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" {...register('currency')} defaultValue="USD" />
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
