import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Info, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DrugInteraction {
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  interactingDrug: string;
  description: string;
  clinicalGuidance: string;
  references?: string[];
}

interface DrugInteractionWarningProps {
  medicationName: string;
  patientId: string;
  onOverride?: () => void;
}

export function DrugInteractionWarning({
  medicationName,
  patientId,
  onOverride,
}: DrugInteractionWarningProps) {
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    checkInteractions();
  }, [medicationName, patientId]);

  const checkInteractions = async () => {
    setLoading(true);
    try {
      // Fetch patient's current medications
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('medication, dosage')
        .eq('patient_id', patientId)
        .in('status', ['approved', 'dispensed']);

      // Fetch patient allergies
      const { data: profile } = await supabase
        .from('profiles')
        .select('allergies')
        .eq('id', patientId)
        .single();

      setAllergies(profile?.allergies || []);

      // Check for drug-drug interactions
      const currentMeds = prescriptions?.map(p => p.medication) || [];
      
      const { data: interactionData, error } = await supabase.functions.invoke('check-drug-interactions', {
        body: {
          newMedication: medicationName,
          currentMedications: currentMeds,
          allergies: profile?.allergies || [],
        }
      });

      if (error) throw error;

      setInteractions(interactionData?.interactions || []);
    } catch (error: any) {
      console.error('Drug interaction check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'contraindicated':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'major':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'moderate':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'minor':
        return <Info className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getSeverityVariant = (severity: string): 'default' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'contraindicated':
      case 'major':
        return 'destructive';
      case 'moderate':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Checking for drug interactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check allergy
  const hasAllergy = allergies.some(allergy => 
    medicationName.toLowerCase().includes(allergy.toLowerCase())
  );

  const criticalInteractions = interactions.filter(i => 
    i.severity === 'contraindicated' || i.severity === 'major'
  );
  const displayedInteractions = showAll ? interactions : criticalInteractions;

  if (!hasAllergy && interactions.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Interactions Found</AlertTitle>
        <AlertDescription>
          No known drug interactions or allergies detected for {medicationName}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {hasAllergy && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>ALLERGY ALERT</AlertTitle>
          <AlertDescription className="mt-2">
            <strong>Patient is allergic to: {allergies.join(', ')}</strong>
            <p className="mt-2">
              This medication may contain or be related to known allergens. 
              Do NOT prescribe without careful consideration.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {criticalInteractions.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {criticalInteractions.length} Critical Interaction{criticalInteractions.length > 1 ? 's' : ''} Detected
          </AlertTitle>
          <AlertDescription>
            Review these interactions before prescribing {medicationName}.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Drug Interaction Checker</span>
            {interactions.length > criticalInteractions.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Critical Only' : `Show All (${interactions.length})`}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayedInteractions.map((interaction, index) => (
            <Card key={index} className="border-l-4" style={{
              borderLeftColor: interaction.severity === 'contraindicated' || interaction.severity === 'major' 
                ? 'hsl(var(--destructive))' 
                : interaction.severity === 'moderate' 
                ? 'hsl(var(--warning))' 
                : 'hsl(var(--muted))'
            }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(interaction.severity)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityVariant(interaction.severity)} className="capitalize">
                        {interaction.severity}
                      </Badge>
                      <span className="font-semibold">
                        {medicationName} + {interaction.interactingDrug}
                      </span>
                    </div>
                    
                    <p className="text-sm">{interaction.description}</p>
                    
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <strong>Clinical Guidance:</strong>
                      <p className="mt-1">{interaction.clinicalGuidance}</p>
                    </div>

                    {interaction.references && interaction.references.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <strong>References:</strong> {interaction.references.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {criticalInteractions.length > 0 && onOverride && (
            <div className="flex items-center justify-between rounded-md border border-destructive bg-destructive/10 p-4">
              <div className="flex-1">
                <p className="font-semibold text-destructive">
                  Override Warning
                </p>
                <p className="text-sm text-muted-foreground">
                  Only proceed if you have reviewed all interactions and determined the benefit outweighs the risk.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={onOverride}
              >
                Override & Prescribe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}