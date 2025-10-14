import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SymptomCheckerIntegration } from './SymptomCheckerIntegration';
import { CarePlanViewer } from './CarePlanViewer';
import { MedicationTracker } from './MedicationTracker';
import { Activity, FileText, Pill, Calendar } from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Patient Dashboard</h1>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="symptoms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Symptoms
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="care-plan" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Care Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <SymptomCheckerIntegration />
          </div>
        </TabsContent>

        <TabsContent value="symptoms">
          <SymptomCheckerIntegration />
        </TabsContent>

        <TabsContent value="medications">
          <MedicationTracker />
        </TabsContent>

        <TabsContent value="care-plan">
          <CarePlanViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};
