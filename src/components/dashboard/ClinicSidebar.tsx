import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Calendar, Users, Settings, BarChart3, CreditCard, Building2, 
  ListChecks, UsersRound, Palette, UsersIcon, Package, DollarSign, 
  FileCheck, TrendingUp, Shield, Focus, Inbox, ChevronDown, Info
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
    title: 'Operations',
    tooltip: 'Day-to-day clinic operations and patient flow',
    defaultOpen: true,
    items: [
      { 
        title: 'Appointments', 
        url: '/clinic/appointments', 
        icon: Calendar,
        tooltip: 'View and manage all clinic appointments'
      },
      { 
        title: 'Waitlist', 
        url: '/clinic/waitlist', 
        icon: ListChecks,
        tooltip: 'Manage patients waiting for appointment slots'
      },
      { 
        title: 'Clinic Queue', 
        url: '/clinic/virtual-clinic-queue', 
        icon: UsersRound,
        tooltip: 'Real-time patient queue and check-in status'
      },
      { 
        title: 'Work Queue', 
        url: '/work-queue', 
        icon: Inbox,
        tooltip: 'Pending tasks and action items for clinic staff'
      },
    ],
  },
  {
    title: 'Staff & Teams',
    tooltip: 'Manage clinic staff, care teams, and resources',
    defaultOpen: true,
    items: [
      { 
        title: 'Staff', 
        url: '/clinic/staff', 
        icon: Users,
        tooltip: 'Manage clinic staff, roles, and permissions'
      },
      { 
        title: 'Care Teams', 
        url: '/care-teams', 
        icon: UsersIcon,
        tooltip: 'Create and manage multidisciplinary care teams'
      },
      { 
        title: 'Resources', 
        url: '/clinic/resources', 
        icon: Package,
        tooltip: 'Manage rooms, equipment, and clinic resources'
      },
    ],
  },
  {
    title: 'Configuration',
    tooltip: 'Clinic settings, branding, and templates',
    items: [
      { 
        title: 'Branding', 
        url: '/clinic/branding', 
        icon: Palette,
        tooltip: 'Customize clinic logo, colors, and public profile'
      },
      { 
        title: 'Templates', 
        url: '/clinic/templates', 
        icon: FileCheck,
        tooltip: 'Create appointment templates and workflows'
      },
      { 
        title: 'Compliance Rules', 
        url: '/clinic/compliance-rules', 
        icon: Shield,
        tooltip: 'Configure HIPAA, regulatory, and policy requirements'
      },
      { 
        title: 'Clinical Focus', 
        url: '/clinical-focus', 
        icon: Focus,
        tooltip: 'Set up distraction-free clinical workflows'
      },
    ],
  },
  {
    title: 'Financial',
    tooltip: 'Revenue tracking, payments, and financial analytics',
    items: [
      { 
        title: 'Payments', 
        url: '/clinic/payments', 
        icon: CreditCard,
        tooltip: 'Process payments and manage billing'
      },
      { 
        title: 'Revenue Dashboard', 
        url: '/clinic/revenue-dashboard', 
        icon: DollarSign,
        tooltip: 'Track revenue, splits, and financial performance'
      },
    ],
  },
  {
    title: 'Analytics',
    tooltip: 'Performance metrics and business intelligence',
    items: [
      { 
        title: 'Analytics', 
        url: '/clinic/analytics', 
        icon: BarChart3,
        tooltip: 'Comprehensive analytics on appointments and operations'
      },
      { 
        title: 'Capacity Analytics', 
        url: '/clinic/capacity-analytics', 
        icon: TrendingUp,
        tooltip: 'Track capacity utilization and resource efficiency'
      },
    ],
  },
  {
    title: 'Settings',
    tooltip: 'Clinic profile and system settings',
    items: [
      { 
        title: 'Profile', 
        url: '/clinic/profile/edit', 
        icon: Building2,
        tooltip: 'Update clinic information and contact details'
      },
      { 
        title: 'Media', 
        url: '/clinic/profile/media-edit', 
        icon: Package,
        tooltip: 'Manage clinic photos, videos, and media assets'
      },
      { 
        title: 'Integrations', 
        url: '/integrations', 
        icon: Package,
        tooltip: 'Connect to 50+ external services and platforms'
      },
      { 
        title: 'Import Profile', 
        url: '/clinic/import-profile', 
        icon: Package,
        tooltip: 'Import clinic data from Google Maps, Yelp, and more'
      },
      { 
        title: 'Settings', 
        url: '/clinic/settings', 
        icon: Settings,
        tooltip: 'Configure clinic settings and integrations'
      },
    ],
  },
];

export function ClinicSidebar() {
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
                    to="/clinic/dashboard"
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
