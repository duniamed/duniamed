import { NavLink } from 'react-router-dom';
import { Home, Calendar, FileText, CreditCard, MessageSquare, Bell, Settings, User, Activity, Clock, BarChart3, Stethoscope, Users, Building2, ListChecks, UsersRound, LifeBuoy, Shield, CalendarSync, Network, Reply, ClipboardList, UserX, Focus, Inbox } from 'lucide-react';
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

const specialistMenuItems = [
  { title: 'Dashboard', url: '/specialist/dashboard', icon: Home },
  { title: 'Appointments', url: '/specialist/appointments', icon: Calendar },
  { title: 'Availability', url: '/specialist/availability', icon: Clock },
  { title: 'Calendar Sync', url: '/calendar-sync-settings', icon: CalendarSync },
  { title: 'Absences', url: '/provider-absences', icon: UserX },
  { title: 'Waitlist', url: '/specialist/waitlist', icon: ListChecks },
  { title: 'Clinic Queue', url: '/specialist/virtual-clinic-queue', icon: UsersRound },
  { title: 'Time Off', url: '/specialist/time-off', icon: Activity },
  { title: 'Virtual Clinic', url: '/specialist/create-virtual-clinic', icon: Building2 },
  { title: 'Insurance Panel', url: '/insurance/management', icon: Shield },
  { title: 'Patients', url: '/specialist/patients', icon: Users },
  { title: 'Review Responses', url: '/review-responses', icon: Reply },
  { title: 'Procedure Tracking', url: '/procedure-tracking', icon: ClipboardList },
  { title: 'Professional Network', url: '/professional-network', icon: Network },
  { title: 'Clinical Focus', url: '/clinical-focus', icon: Focus },
  { title: 'Work Queue', url: '/work-queue', icon: Inbox },
  { title: 'Performance Metrics', url: '/specialist/performance', icon: BarChart3 },
  { title: 'Specialist Forums', url: '/forums', icon: MessageSquare },
  { title: 'Messages', url: '/specialist/messages', icon: MessageSquare },
  { title: 'Payments', url: '/specialist/payments', icon: CreditCard },
  { title: 'Analytics', url: '/specialist/analytics', icon: BarChart3 },
  { title: 'Support', url: '/support/tickets', icon: LifeBuoy },
  { title: 'Notifications', url: '/specialist/notifications', icon: Bell },
  { title: 'Profile', url: '/specialist/profile', icon: User },
  { title: 'Settings', url: '/specialist/profile/edit', icon: Settings },
];

export function SpecialistSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Specialist Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {specialistMenuItems.map((item) => (
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
