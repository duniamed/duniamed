import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, Settings, BarChart3, CreditCard, Building2, UserPlus, FileText, ListChecks, UsersRound, Palette } from 'lucide-react';
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

const clinicMenuItems = [
  { title: 'Dashboard', url: '/clinic/dashboard', icon: Home },
  { title: 'Appointments', url: '/clinic/appointments', icon: Calendar },
  { title: 'Staff', url: '/clinic/staff', icon: Users },
  { title: 'Branding', url: '/clinic/branding', icon: Palette },
  { title: 'Waitlist', url: '/clinic/waitlist', icon: ListChecks },
  { title: 'Clinic Queue', url: '/clinic/virtual-clinic-queue', icon: UsersRound },
  { title: 'Analytics', url: '/clinic/analytics', icon: BarChart3 },
  { title: 'Payments', url: '/clinic/payments', icon: CreditCard },
  { title: 'Profile', url: '/clinic/profile/edit', icon: Building2 },
  { title: 'Settings', url: '/clinic/settings', icon: Settings },
];

export function ClinicSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clinic Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clinicMenuItems.map((item) => (
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
