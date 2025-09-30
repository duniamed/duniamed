import { UseFormReturn } from 'react-hook-form';
import { SignupFormData } from '@/lib/validations/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface ClinicSignupFormProps {
  form: UseFormReturn<SignupFormData>;
}

export function ClinicSignupForm({ form }: ClinicSignupFormProps) {
  const jurisdiction = form.watch('jurisdiction');

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
          value={form.watch('clinicType')}
          onValueChange={(value) => form.setValue('clinicType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="virtual">Virtual Clinic</SelectItem>
            <SelectItem value="physical">Physical Clinic</SelectItem>
            <SelectItem value="hybrid">Hybrid (Virtual + Physical)</SelectItem>
            <SelectItem value="hospital">Hospital</SelectItem>
            <SelectItem value="diagnostic_center">Diagnostic Center</SelectItem>
          </SelectContent>
        </Select>
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
