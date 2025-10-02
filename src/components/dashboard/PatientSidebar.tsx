import { NavLink } from 'react-router-dom';
import { Home, Calendar, FileText, CreditCard, MessageSquare, Users, Heart, Bell, Settings, User, Upload, Search, Pill, Stethoscope, Shield, DollarSign, Share2, Download } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const patientMenuItems = [
  { title: 'Dashboard', url: '/patient/dashboard', icon: Home },
  { title: 'Symptom Checker', url: '/patient/symptom-checker', icon: Stethoscope },
  { title: 'Find Specialists', url: '/search/specialists', icon: Search },
  { title: 'Appointments', url: '/patient/appointments', icon: Calendar },
  { title: 'Prescriptions', url: '/patient/prescriptions', icon: Pill },
  { title: 'Medical Records', url: '/patient/medical-records', icon: FileText },
  { title: 'Upload Records', url: '/patient/medical-records/upload', icon: Upload },
  { title: 'Document Sharing', url: '/document-sharing', icon: Share2 },
  { title: 'Messages', url: '/patient/messages', icon: MessageSquare },
  { title: 'Payments', url: '/patient/payments', icon: CreditCard },
  { title: 'Insurance Check', url: '/patient/insurance-check', icon: Shield },
  { title: 'Cost Estimator', url: '/cost-estimator', icon: DollarSign },
  { title: 'Family Members', url: '/patient/family-members', icon: Users },
  { title: 'Favorites', url: '/patient/favorites', icon: Heart },
  { title: 'Data Export', url: '/data-export', icon: Download },
  { title: 'Notifications', url: '/patient/notifications', icon: Bell },
  { title: 'Profile', url: '/patient/profile', icon: User },
  { title: 'Settings', url: '/profile/edit', icon: Settings },
];

export function PatientSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Patient Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {patientMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
