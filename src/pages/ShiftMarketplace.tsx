import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import ShiftMarketplaceComponent from '@/components/ShiftMarketplace';

export default function ShiftMarketplace() {
  return (
    <DashboardLayout title="Shift Marketplace">
      <ShiftMarketplaceComponent />
    </DashboardLayout>
  );
}