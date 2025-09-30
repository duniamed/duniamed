import { UseFormReturn } from 'react-hook-form';
import { SignupFormData } from '@/lib/validations/auth';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { InfoIcon } from 'lucide-react';

interface PatientSignupFormProps {
  form: UseFormReturn<SignupFormData>;
}

export function PatientSignupForm({ form }: PatientSignupFormProps) {
  const jurisdiction = form.watch('jurisdiction');

  const getConsentInfo = () => {
    switch (jurisdiction) {
      case 'EU_UK':
        return 'Your health data is classified as "special category" under GDPR Article 9. We process it based on your explicit consent and for healthcare purposes.';
      case 'US':
        return 'Your Protected Health Information (PHI) is handled according to HIPAA Privacy Rule. We are a HIPAA-compliant platform.';
      case 'CA':
        return 'Your personal health information is protected under PIPEDA and provincial health information laws. We collect, use, and disclose information with your consent.';
      case 'BR':
        return 'Your health data is protected under LGPD (Lei Geral de Proteção de Dados). We process it lawfully with appropriate safeguards.';
      case 'IN':
        return 'Your health information is protected according to India\'s data protection framework and telemedicine guidelines.';
      case 'AU':
        return 'Your health information is protected under Australian Privacy Principles (APPs) and health records legislation.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {jurisdiction && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {getConsentInfo()}
          </AlertDescription>
        </Alert>
      )}

      {jurisdiction === 'EU_UK' && (
        <div className="space-y-2">
          <Label htmlFor="gdprArticle9Basis">Legal Basis for Processing (GDPR Article 9)</Label>
          <Select
            value={form.watch('gdprArticle9Basis') || ''}
            onValueChange={(value) => form.setValue('gdprArticle9Basis', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select legal basis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="explicit_consent">Explicit consent for health/social care</SelectItem>
              <SelectItem value="medical_diagnosis">Medical diagnosis by health professional</SelectItem>
              <SelectItem value="preventive_medicine">Preventive or occupational medicine</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This specifies the lawful condition for processing your health data
          </p>
        </div>
      )}

      {jurisdiction === 'US' && (
        <div className="flex items-start space-x-2 mt-4">
          <Checkbox
            id="hipaaAcknowledgment"
            checked={form.watch('hipaaAcknowledgment')}
            onCheckedChange={(checked) => form.setValue('hipaaAcknowledgment', checked as boolean)}
          />
          <Label htmlFor="hipaaAcknowledgment" className="text-sm font-normal leading-tight">
            I acknowledge receipt of the Notice of Privacy Practices and understand how my health information may be used and disclosed
          </Label>
        </div>
      )}

      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <h4 className="font-medium text-sm">Data Processing Consent</h4>
        <p className="text-xs text-muted-foreground">
          By checking this box, you consent to the processing of your personal and health data for:
        </p>
        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
          <li>Providing telemedicine consultations</li>
          <li>Managing your medical records</li>
          <li>Communication with healthcare providers</li>
          <li>Compliance with legal obligations</li>
        </ul>
      </div>
    </div>
  );
}
