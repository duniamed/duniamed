import { UseFormReturn } from 'react-hook-form';
import { SignupFormData } from '@/lib/validations/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { InfoIcon } from 'lucide-react';
import { MEDICAL_SPECIALTIES, SPECIALIST_TYPES } from '@/lib/constants/specialties';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface SpecialistSignupFormProps {
  form: UseFormReturn<SignupFormData>;
}

export function SpecialistSignupForm({ form }: SpecialistSignupFormProps) {
  const jurisdiction = form.watch('jurisdiction');
  const selectedSpecialties = form.watch('specialties') || [];
  const [specialtySearch, setSpecialtySearch] = useState('');

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

  const filteredSpecialties = MEDICAL_SPECIALTIES.filter(specialty =>
    specialty.toLowerCase().includes(specialtySearch.toLowerCase())
  );

  const toggleSpecialty = (specialty: string) => {
    const current = selectedSpecialties;
    if (current.includes(specialty)) {
      form.setValue('specialties', current.filter(s => s !== specialty));
    } else {
      form.setValue('specialties', [...current, specialty]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    form.setValue('specialties', selectedSpecialties.filter(s => s !== specialty));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="specialistType">Professional Type</Label>
        <Select
          value={form.watch('specialistType')}
          onValueChange={(value) => form.setValue('specialistType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select professional type" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALIST_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.specialistType && (
          <p className="text-sm text-destructive">{form.formState.errors.specialistType.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Medical Specialties (Select all that apply)</Label>
        <Input
          placeholder="Search specialties..."
          value={specialtySearch}
          onChange={(e) => setSpecialtySearch(e.target.value)}
        />
        
        {selectedSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
            {selectedSpecialties.map(specialty => (
              <Badge key={specialty} variant="secondary" className="gap-1">
                {specialty}
                <button
                  type="button"
                  onClick={() => removeSpecialty(specialty)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="border rounded-md max-h-64 overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredSpecialties.map(specialty => (
              <div
                key={specialty}
                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                onClick={() => toggleSpecialty(specialty)}
              >
                <Checkbox
                  checked={selectedSpecialties.includes(specialty)}
                  onCheckedChange={() => toggleSpecialty(specialty)}
                />
                <span className="text-sm">{specialty}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Selected {selectedSpecialties.length} specialt{selectedSpecialties.length === 1 ? 'y' : 'ies'}
        </p>
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
