import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Download } from "lucide-react";

export default function EpicFHIRSync() {
  const [patientId, setPatientId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [resourceType, setResourceType] = useState("Patient");
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const syncFromEpic = async () => {
    if (!patientId || !accessToken) {
      toast({ title: "Missing fields", description: "Please provide patient ID and access token", variant: "destructive" });
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('epic-fhir-sync', {
        body: { patientId, epicAccessToken: accessToken, resourceType }
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: `Imported ${data.resourcesImported} ${resourceType} resources from Epic`
      });
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Epic FHIR Sync
        </CardTitle>
        <CardDescription>Import patient data from Epic EHR system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="patientId">Patient ID</Label>
          <Input
            id="patientId"
            placeholder="Enter Epic Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="accessToken">Epic Access Token</Label>
          <Input
            id="accessToken"
            type="password"
            placeholder="Enter Epic OAuth token"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resourceType">Resource Type</Label>
          <Select value={resourceType} onValueChange={setResourceType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Patient">Patient Demographics</SelectItem>
              <SelectItem value="Condition">Conditions</SelectItem>
              <SelectItem value="MedicationRequest">Medications</SelectItem>
              <SelectItem value="AllergyIntolerance">Allergies</SelectItem>
              <SelectItem value="Observation">Lab Results</SelectItem>
              <SelectItem value="Immunization">Immunizations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={syncFromEpic} disabled={syncing} className="w-full">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync from Epic'}
        </Button>
      </CardContent>
    </Card>
  );
}
