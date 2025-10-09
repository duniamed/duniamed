import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Calendar, CreditCard, MessageSquare, Bell, Settings, User, 
  Activity, Clock, BarChart3, Users, Building2, ListChecks, UsersRound, 
  LifeBuoy, Shield, CalendarSync, Network, Reply, ClipboardList, UserX, 
  Focus, Inbox, ChevronDown, Info
} from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  tooltip: string;
}

interface MenuGroup {
  title: string;
  tooltip: string;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Schedule',
    tooltip: 'Manage your appointments, availability, and calendar',
    defaultOpen: true,
    items: [
      { 
        title: 'Appointments', 
        url: '/specialist/appointments', 
        icon: Calendar,
        tooltip: 'View and manage upcoming patient consultations'
      },
      { 
        title: 'Availability', 
        url: '/specialist/availability', 
        icon: Clock,
        tooltip: 'Set your weekly schedule and available time slots'
      },
      { 
        title: 'Calendar Sync', 
        url: '/calendar-sync-settings', 
        icon: CalendarSync,
        tooltip: 'Sync with Google, Outlook, or Apple Calendar'
      },
      { 
        title: 'Time Off', 
        url: '/specialist/time-off', 
        icon: Activity,
        tooltip: 'Request vacation, sick days, and manage absences'
      },
      { 
        title: 'Absences', 
        url: '/provider-absences', 
        icon: UserX,
        tooltip: 'View scheduled absences and block dates'
      },
    ],
  },
  {
    title: 'Patient Care',
    tooltip: 'Patient management and clinical workflows',
    defaultOpen: true,
    items: [
      { 
        title: 'Waitlist', 
        url: '/specialist/waitlist', 
        icon: ListChecks,
        tooltip: 'Manage patients waiting for earlier appointment slots'
      },
      { 
        title: 'Clinic Queue', 
        url: '/specialist/virtual-clinic-queue', 
        icon: UsersRound,
        tooltip: 'Real-time queue of patients ready for consultation'
      },
      { 
        title: 'Work Queue', 
        url: '/work-queue', 
        icon: Inbox,
        tooltip: 'Pending tasks, follow-ups, and action items'
      },
      { 
        title: 'Patients', 
        url: '/specialist/patients', 
        icon: Users,
        tooltip: 'View patient list and access medical records'
      },
      { 
        title: 'Procedure Tracking', 
        url: '/procedure-tracking', 
        icon: ClipboardList,
        tooltip: 'Track procedures, surgeries, and follow-up care'
      },
    ],
  },
  {
    title: 'Practice',
    tooltip: 'Manage your practice, clinic, and business operations',
    items: [
      { 
        title: 'Virtual Clinic', 
        url: '/specialist/create-virtual-clinic', 
        icon: Building2,
        tooltip: 'Create and manage your virtual practice'
      },
      { 
        title: 'Insurance Panel', 
        url: '/insurance/management', 
        icon: Shield,
        tooltip: 'Manage accepted insurance plans and eligibility'
      },
      { 
        title: 'Review Responses', 
        url: '/review-responses', 
        icon: Reply,
        tooltip: 'Respond to patient reviews and feedback'
      },
      { 
        title: 'Clinical Focus', 
        url: '/clinical-focus', 
        icon: Focus,
        tooltip: 'Distraction-free mode for focused clinical work'
      },
    ],
  },
  {
    title: 'Analytics',
    tooltip: 'Track performance metrics and earnings',
    items: [
      { 
        title: 'Performance', 
        url: '/specialist/performance', 
        icon: BarChart3,
        tooltip: 'View patient satisfaction, outcomes, and metrics'
      },
      { 
        title: 'Analytics', 
        url: '/specialist/analytics', 
        icon: BarChart3,
        tooltip: 'Detailed analytics on appointments and revenue'
      },
      { 
        title: 'Payments', 
        url: '/specialist/payments', 
        icon: CreditCard,
        tooltip: 'Track earnings, invoices, and payment history'
      },
    ],
  },
  {
    title: 'Communication',
    tooltip: 'Connect with patients and colleagues',
    items: [
      { 
        title: 'Messages', 
        url: '/specialist/messages', 
        icon: MessageSquare,
        tooltip: 'Secure messaging with patients and care team'
      },
      { 
        title: 'Forums', 
        url: '/forums', 
        icon: MessageSquare,
        tooltip: 'Professional forums for specialists and discussions'
      },
      { 
        title: 'Network', 
        url: '/professional-network', 
        icon: Network,
        tooltip: 'Connect with other healthcare professionals'
      },
      { 
        title: 'Support', 
        url: '/support/tickets', 
        icon: LifeBuoy,
        tooltip: 'Get technical support and platform assistance'
      },
    ],
  },
  {
    title: 'Settings',
    tooltip: 'Configure your profile and preferences',
    items: [
      { 
        title: 'Notifications', 
        url: '/specialist/notifications', 
        icon: Bell,
        tooltip: 'Manage notification preferences and alerts'
      },
      { 
        title: 'Profile', 
        url: '/specialist/profile', 
        icon: User,
        tooltip: 'Update your professional profile and credentials'
      },
      { 
        title: 'Settings', 
        url: '/specialist/profile/edit', 
        icon: Settings,
        tooltip: 'Account settings, privacy, and security options'
      },
    ],
  },
];

export function SpecialistSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    menuGroups.reduce((acc, group) => {
      acc[group.title] = group.defaultOpen ?? false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="gap-2">
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <NavLink
                    to="/specialist/dashboard"
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 py-2',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50'
                      )
                    }
                  >
                    <Home className="h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsible Groups */}
        {!collapsed && (
          <TooltipProvider delayDuration={300}>
            {menuGroups.map((group) => (
              <Collapsible
                key={group.title}
                open={openGroups[group.title]}
                onOpenChange={() => toggleGroup(group.title)}
              >
                <SidebarGroup>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between hover:bg-muted/50 rounded-md px-2 py-1.5 cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{group.title}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs bg-popover text-popover-foreground">
                            <p className="text-sm">{group.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          openGroups[group.title] && 'rotate-180'
                        )}
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SidebarMenuButton asChild>
                                  <NavLink
                                    to={item.url}
                                    className={({ isActive }) =>
                                      cn(
                                        'flex items-center gap-3 py-2 pl-4',
                                        isActive
                                          ? 'bg-primary/10 text-primary font-medium'
                                          : 'hover:bg-muted/50'
                                      )
                                    }
                                  >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                  </NavLink>
                                </SidebarMenuButton>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs bg-popover text-popover-foreground">
                                <p className="text-sm">{item.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ))}
          </TooltipProvider>
        )}

        {/* Collapsed view */}
        {collapsed && (
          <TooltipProvider delayDuration={300}>
            {menuGroups.map((group) =>
              group.items.map((item) => (
                <SidebarGroup key={item.title}>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className={({ isActive }) =>
                                  cn(
                                    'flex items-center justify-center',
                                    isActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'hover:bg-muted/50'
                                  )
                                }
                              >
                                <item.icon className="h-4 w-4" />
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs bg-popover text-popover-foreground">
                            <p className="font-medium mb-1">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))
            )}
          </TooltipProvider>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
