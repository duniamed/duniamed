import React from 'react';
import { useParams } from 'react-router-dom';
import { PhysicalClinicDashboard } from '@/components/clinic/PhysicalClinicDashboard';
import { StaffManagementPanel } from '@/components/clinic/StaffManagementPanel';
import { HybridScheduleOptimizer } from '@/components/scheduling/HybridScheduleOptimizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PhysicalClinicDashboardPage: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const specialistId = 'current-specialist-id'; // Get from auth context

  if (!clinicId) {
    return <div>Clinic not found</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="scheduling">Hybrid Scheduling</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PhysicalClinicDashboard clinicId={clinicId} />
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <StaffManagementPanel clinicId={clinicId} />
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <HybridScheduleOptimizer
            specialistId={specialistId}
            clinicId={clinicId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhysicalClinicDashboardPage;
