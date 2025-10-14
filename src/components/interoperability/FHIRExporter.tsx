import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface FHIRExporterProps {
  patientId: string;
}

export const FHIRExporter: React.FC<FHIRExporterProps> = ({ patientId }) => {
  const [selectedResources, setSelectedResources] = useState<string[]>([
    'Patient',
    'Encounter',
    'MedicationRequest'
  ]);
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('export-fhir-bundle', {
        body: {
          patientId,
          resourceTypes: selectedResources
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Download FHIR bundle as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/fhir+json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `fhir-bundle-${patientId}-${Date.now()}.json`;
      link.href = url;
      link.click();

      toast({
        title: "FHIR Bundle Exported",
        description: `Exported ${data.entry?.length || 0} resources`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resourceTypes = [
    'Patient',
    'Encounter',
    'MedicationRequest',
    'Observation',
    'Condition',
    'Procedure',
    'AllergyIntolerance',
    'Immunization',
    'DiagnosticReport',
    'DocumentReference'
  ];

  const toggleResource = (resource: string) => {
    setSelectedResources(prev =>
      prev.includes(resource)
        ? prev.filter(r => r !== resource)
        : [...prev, resource]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          FHIR Bundle Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Select Resource Types:
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {resourceTypes.map(resource => (
              <div key={resource} className="flex items-center space-x-2">
                <Checkbox
                  id={resource}
                  checked={selectedResources.includes(resource)}
                  onCheckedChange={() => toggleResource(resource)}
                />
                <Label htmlFor={resource} className="cursor-pointer text-sm">
                  {resource}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>FHIR R4 Compliant:</strong> This export follows HL7 FHIR Release 4
            standards for healthcare interoperability. Compatible with MyHealth@EU and
            other EHDS-compliant systems.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending || selectedResources.length === 0}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            {exportMutation.isPending ? 'Exporting...' : 'Export Bundle'}
          </Button>
          <Button variant="outline" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share Securely
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Bundle includes complete clinical data</p>
          <p>• Encrypted during transmission</p>
          <p>• GDPR/HIPAA compliant format</p>
          <p>• Ready for cross-border exchange</p>
        </div>
      </CardContent>
    </Card>
  );
};
