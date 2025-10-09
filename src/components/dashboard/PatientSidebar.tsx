import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Calendar, FileText, CreditCard, MessageSquare, Users, Heart, 
  Bell, Settings, User, Upload, Search, Pill, Stethoscope, Shield, 
  DollarSign, Share2, Download, LifeBuoy, FileSignature, CalendarSync, 
  ClipboardList, Focus, ChevronDown, Info
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
    title: 'Find Care',
    tooltip: 'Search for doctors, check symptoms, and explore specialists',
    defaultOpen: true,
    items: [
      { 
        title: 'Symptom Checker', 
        url: '/patient/symptom-checker', 
        icon: Stethoscope,
        tooltip: 'AI-powered tool to help you understand your symptoms and get recommendations'
      },
      { 
        title: 'Find Specialists', 
        url: '/search/specialists', 
        icon: Search,
        tooltip: 'Search and book appointments with verified healthcare professionals'
      },
      { 
        title: 'Advanced Search', 
        url: '/specialist/advanced-search', 
        icon: Search,
        tooltip: 'Filter specialists by location, specialty, insurance, and availability'
      },
    ],
  },
  {
    title: 'Appointments',
    tooltip: 'Manage all your medical appointments and scheduling',
    defaultOpen: true,
    items: [
      { 
        title: 'My Appointments', 
        url: '/patient/appointments', 
        icon: Calendar,
        tooltip: 'View, manage, and join your scheduled consultations'
      },
      { 
        title: 'Waitlist', 
        url: '/patient/waitlist', 
        icon: Bell,
        tooltip: 'Get notified when earlier appointment slots become available'
      },
      { 
        title: 'Group Booking', 
        url: '/patient/group-booking', 
        icon: Users,
        tooltip: 'Book appointments for multiple family members at once'
      },
      { 
        title: 'Multi-Practitioner', 
        url: '/multi-practitioner-scheduling', 
        icon: Users,
        tooltip: 'Schedule appointments with multiple healthcare providers in one visit'
      },
      { 
        title: 'Calendar Sync', 
        url: '/calendar-sync-settings', 
        icon: CalendarSync,
        tooltip: 'Sync appointments with Google Calendar, Outlook, or Apple Calendar'
      },
    ],
  },
  {
    title: 'Health Records',
    tooltip: 'Access and manage your medical documents and health information',
    items: [
      { 
        title: 'Medical Records', 
        url: '/patient/medical-records', 
        icon: FileText,
        tooltip: 'View your complete medical history, test results, and clinical notes'
      },
      { 
        title: 'Upload Records', 
        url: '/patient/medical-records/upload', 
        icon: Upload,
        tooltip: 'Securely upload lab results, imaging, and other medical documents'
      },
      { 
        title: 'Procedure Tracking', 
        url: '/procedure-tracking', 
        icon: ClipboardList,
        tooltip: 'Track scheduled procedures, surgeries, and follow-up care'
      },
      { 
        title: 'Document Sharing', 
        url: '/document-sharing', 
        icon: Share2,
        tooltip: 'Share medical records securely with doctors or family members'
      },
      { 
        title: 'Secure Delivery', 
        url: '/secure-delivery', 
        icon: FileSignature,
        tooltip: 'Receive and sign medical documents with HIPAA-compliant security'
      },
    ],
  },
  {
    title: 'Medications',
    tooltip: 'Manage prescriptions and medication renewals',
    items: [
      { 
        title: 'Prescriptions', 
        url: '/patient/prescriptions', 
        icon: Pill,
        tooltip: 'View active prescriptions, dosage instructions, and refill status'
      },
      { 
        title: 'Renewals', 
        url: '/prescription-renewals', 
        icon: Pill,
        tooltip: 'Request prescription renewals and track approval status'
      },
    ],
  },
  {
    title: 'Communication',
    tooltip: 'Connect with doctors, community, and support team',
    items: [
      { 
        title: 'Messages', 
        url: '/patient/messages', 
        icon: MessageSquare,
        tooltip: 'Secure messaging with your healthcare providers'
      },
      { 
        title: 'Community Forums', 
        url: '/community-forums', 
        icon: MessageSquare,
        tooltip: 'Join discussions and connect with other patients'
      },
      { 
        title: 'Support', 
        url: '/support/tickets', 
        icon: LifeBuoy,
        tooltip: 'Get help from our support team with technical or account issues'
      },
    ],
  },
  {
    title: 'Financial',
    tooltip: 'Handle payments, insurance, and cost estimates',
    items: [
      { 
        title: 'Payments', 
        url: '/patient/payments', 
        icon: CreditCard,
        tooltip: 'View payment history, manage payment methods, and pay outstanding balances'
      },
      { 
        title: 'Insurance Check', 
        url: '/patient/insurance-check', 
        icon: Shield,
        tooltip: 'Verify insurance coverage and check eligibility for services'
      },
      { 
        title: 'Cost Estimator', 
        url: '/cost-estimator', 
        icon: DollarSign,
        tooltip: 'Get cost estimates for procedures and consultations'
      },
    ],
  },
  {
    title: 'My Network',
    tooltip: 'Manage family members and favorite doctors',
    items: [
      { 
        title: 'Family Members', 
        url: '/patient/family-members', 
        icon: Users,
        tooltip: 'Add family members and manage appointments on their behalf'
      },
      { 
        title: 'Favorites', 
        url: '/patient/favorites', 
        icon: Heart,
        tooltip: 'Quick access to your preferred doctors and specialists'
      },
    ],
  },
  {
    title: 'Settings',
    tooltip: 'Customize your account and preferences',
    items: [
      { 
        title: 'Clinical Focus', 
        url: '/clinical-focus', 
        icon: Focus,
        tooltip: 'Distraction-free mode for focused health management'
      },
      { 
        title: 'Data Export', 
        url: '/data-export', 
        icon: Download,
        tooltip: 'Download your complete medical data in standard formats'
      },
      { 
        title: 'Notifications', 
        url: '/patient/notifications', 
        icon: Bell,
        tooltip: 'Manage notification preferences for appointments and messages'
      },
      { 
        title: 'Profile', 
        url: '/patient/profile', 
        icon: User,
        tooltip: 'Update your personal information and health profile'
      },
      { 
        title: 'Settings', 
        url: '/profile/edit', 
        icon: Settings,
        tooltip: 'Configure account settings, privacy, and security options'
      },
    ],
  },
];

export function PatientSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  
  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    menuGroups.reduce((acc, group) => {
      acc[group.title] = group.defaultOpen ?? false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="gap-2">
        {/* Dashboard - Always visible */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <NavLink
                    to="/patient/dashboard"
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

        {/* Collapsed view - show all items */}
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
