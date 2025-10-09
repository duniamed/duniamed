import { UseFormReturn } from 'react-hook-form';
import { SignupFormData } from '@/lib/validations/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, X } from 'lucide-react';
import { MEDICAL_SPECIALTIES } from '@/lib/constants/specialties';

// Valid clinic types for the database enum
const CLINIC_TYPES = [
  { value: 'physical', label: 'Physical Clinic' },
  { value: 'virtual', label: 'Virtual/Telemedicine Clinic' },
  { value: 'hybrid', label: 'Hybrid (Physical + Virtual)' }
];
import { useState } from 'react';

interface ClinicSignupFormProps {
  form: UseFormReturn<SignupFormData>;
}

export function ClinicSignupForm({ form }: ClinicSignupFormProps) {
  const jurisdiction = form.watch('jurisdiction');
  const clinicType = form.watch('clinicType');
  const selectedSpecialties = form.watch('clinicSpecialties') || [];
  const [specialtySearch, setSpecialtySearch] = useState('');

  // Always show specialties selection for clinics
  const showSpecialties = true;

  const getJurisdictionInfo = () => {
    switch (jurisdiction) {
      case 'BR':
        return 'Brazil: Requires CNES registration for facilities and CRM registration with a responsible medical director.';
      case 'EU_UK':
        return 'EU/UK: Healthcare establishments must comply with GDPR and may need to register with local health authorities.';
      case 'US':
        return 'US: Healthcare facilities must comply with HIPAA and state-specific regulations.';
      case 'CA':
        return 'Canada: Healthcare facilities must comply with PIPEDA and provincial health facility regulations.';
      case 'IN':
        return 'India: Healthcare establishments should register with state medical councils and follow telemedicine guidelines.';
      case 'AU':
        return 'Australia: Private health facilities may need registration under state/territory health services acts.';
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
      form.setValue('clinicSpecialties', current.filter(s => s !== specialty));
    } else {
      form.setValue('clinicSpecialties', [...current, specialty]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    form.setValue('clinicSpecialties', selectedSpecialties.filter(s => s !== specialty));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clinicName">Clinic/Facility Name</Label>
        <Input
          id="clinicName"
          placeholder="Enter clinic name"
          {...form.register('clinicName')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clinicType">Facility Type</Label>
        <Select
          value={form.watch('clinicType') || ''}
          onValueChange={(value) => form.setValue('clinicType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select facility type" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {CLINIC_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showSpecialties && (
        <div className="space-y-2">
          <Label>Specialties Offered (Select all that apply)</Label>
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
      )}

      {jurisdiction && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {getJurisdictionInfo()}
          </AlertDescription>
        </Alert>
      )}

      {jurisdiction === 'BR' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="facilityId">CNES Number (Brazil)</Label>
            <Input
              id="facilityId"
              placeholder="Enter CNES facility identifier"
              {...form.register('facilityId')}
            />
            <p className="text-xs text-muted-foreground">
              National Registry of Health Establishments
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsibleDirector">Responsible Medical Director</Label>
            <Input
              id="responsibleDirector"
              placeholder="Full name and CRM number"
              {...form.register('responsibleDirector')}
            />
            <p className="text-xs text-muted-foreground">
              Required for medical service provision
            </p>
          </div>
        </>
      )}

      {jurisdiction === 'US' && (
        <div className="space-y-2">
          <Label htmlFor="facilityId">NPI (National Provider Identifier)</Label>
          <Input
            id="facilityId"
            placeholder="Enter facility NPI"
            {...form.register('facilityId')}
          />
        </div>
      )}

      {(jurisdiction === 'EU_UK' || jurisdiction === 'AU') && (
        <div className="space-y-2">
          <Label htmlFor="facilityId">Facility Registration Number</Label>
          <Input
            id="facilityId"
            placeholder="Enter registration number"
            {...form.register('facilityId')}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="responsibleDirector">Primary Contact / Director</Label>
        <Input
          id="responsibleDirector"
          placeholder="Full name and credentials"
          {...form.register('responsibleDirector')}
        />
      </div>
    </div>
  );
}
