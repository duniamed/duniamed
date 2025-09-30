import { UseFormReturn } from 'react-hook-form';
import { SignupFormData } from '@/lib/validations/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface SpecialistSignupFormProps {
  form: UseFormReturn<SignupFormData>;
}

export function SpecialistSignupForm({ form }: SpecialistSignupFormProps) {
  const jurisdiction = form.watch('jurisdiction');

  const getJurisdictionInfo = () => {
    switch (jurisdiction) {
      case 'EU_UK':
        return 'EU/UK: GDPR Article 9 applies. Health data requires special-category processing consent.';
      case 'US':
        return 'US: HIPAA Privacy Rule applies. You must comply with PHI handling requirements.';
      case 'CA':
        return 'Canada: PIPEDA applies with provincial health information laws.';
      case 'BR':
        return 'Brazil: CRM registration required. Must register with Regional Council of Medicine.';
      case 'IN':
        return 'India: RMP registration required per Telemedicine Practice Guidelines (2020).';
      case 'AU':
        return 'Australia: Ahpra registration required. Verify via Register of practitioners.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="specialistType">Specialist Type</Label>
        <Select
          value={form.watch('specialistType')}
          onValueChange={(value) => form.setValue('specialistType', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="physician">Physician</SelectItem>
            <SelectItem value="psychologist">Psychologist</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
            <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
            <SelectItem value="dentist">Dentist</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.specialistType && (
          <p className="text-sm text-destructive">{form.formState.errors.specialistType.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialty">Specialty</Label>
        <Input
          id="specialty"
          placeholder="e.g., Cardiology, General Medicine"
          {...form.register('specialty')}
        />
      </div>

      {jurisdiction && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {getJurisdictionInfo()}
          </AlertDescription>
        </Alert>
      )}

      {jurisdiction === 'BR' && (
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">CRM Number (Brazil)</Label>
          <Input
            id="licenseNumber"
            placeholder="Enter your CRM registration number"
            {...form.register('licenseNumber')}
          />
          <p className="text-xs text-muted-foreground">
            Required for medical practice in Brazil
          </p>
        </div>
      )}

      {jurisdiction === 'IN' && (
        <div className="space-y-2">
          <Label htmlFor="registrationNumber">RMP Registration Number</Label>
          <Input
            id="registrationNumber"
            placeholder="Enter your RMP registration"
            {...form.register('registrationNumber')}
          />
          <p className="text-xs text-muted-foreground">
            Per Telemedicine Practice Guidelines (2020)
          </p>
        </div>
      )}

      {jurisdiction === 'AU' && (
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Ahpra Registration Number</Label>
          <Input
            id="licenseNumber"
            placeholder="Enter your Ahpra number"
            {...form.register('licenseNumber')}
          />
          <p className="text-xs text-muted-foreground">
            Verify at Ahpra Register of practitioners
          </p>
        </div>
      )}

      {(jurisdiction === 'US' || jurisdiction === 'CA') && (
        <>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              placeholder="Enter your medical license number"
              {...form.register('licenseNumber')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseState">License State/Province</Label>
            <Input
              id="licenseState"
              placeholder="e.g., CA, Ontario"
              {...form.register('licenseState')}
            />
          </div>
        </>
      )}

      {jurisdiction === 'EU_UK' && (
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Professional Registration Number</Label>
          <Input
            id="licenseNumber"
            placeholder="Enter your registration number"
            {...form.register('licenseNumber')}
          />
        </div>
      )}
    </div>
  );
}
