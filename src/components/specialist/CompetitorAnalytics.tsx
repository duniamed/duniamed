// Unlimited Edge Function Capacities: No limits on analytics processing
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Platform {
  name: string;
  specialistFeatures: string[];
  clinicFeatures: string[];
  insights: string;
}

const platforms: Platform[] = [
  {
    name: 'Zocdoc',
    specialistFeatures: [
      'Patient Choice dashboard with quarterly metrics (cancellation rates, ratings)',
      'Badge qualification tracking',
      'Real-time assessment status'
    ],
    clinicFeatures: [
      'Enhanced Performance Dashboard for booking trends',
      'Historical comparisons and organization-wide views',
      'Cancellation and lead-time analytics'
    ],
    insights: 'Focus on patient acquisition metrics and quarterly reviews'
  },
  {
    name: 'Doctoralia',
    specialistFeatures: [
      'Reporting & statistics for appointment management',
      'Patient history and engagement tracking',
      'Visibility metrics from bookings and reviews'
    ],
    clinicFeatures: [
      'Billing & invoicing analytics tied to patient flow',
      'Operational reports on no-shows',
      'Revenue from online scheduling'
    ],
    insights: 'Strong emphasis on operational efficiency and billing integration'
  },
  {
    name: 'Doctolib',
    specialistFeatures: [
      'Feature monitoring framework with KPIs',
      'User/product analytics data models',
      'Consultation trends and patient adherence tracking'
    ],
    clinicFeatures: [
      'Comprehensive patient demographics reports',
      'Operational efficiency metrics',
      'Resource utilization tracking',
      'Data-driven care planning support'
    ],
    insights: 'Most comprehensive data modeling and KPI framework'
  },
  {
    name: 'Practo',
    specialistFeatures: [
      'Analytics for procedure revenue',
      'Patient records performance tracking',
      'Digital health records access'
    ],
    clinicFeatures: [
      'Revenue sources tracking',
      'Expenditure analysis',
      'Patient flow metrics',
      'Business growth evaluation'
    ],
    insights: 'Focus on financial analytics and growth metrics'
  },
  {
    name: 'NexHealth',
    specialistFeatures: [
      'Daily schedule analytics',
      'Appointment stats tracking',
      'Reminder response metrics'
    ],
    clinicFeatures: [
      'Prebuilt dashboards for total appointments',
      'Recall and online booking metrics',
      '7-day performance tracking',
      'Customizable time periods with drill-down tiles'
    ],
    insights: 'Best prebuilt dashboards with customization options'
  }
];

export function CompetitorAnalytics() {
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

  const togglePlatform = (platform: string) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(platform)) {
      newExpanded.delete(platform);
    } else {
      newExpanded.add(platform);
    }
    setExpandedPlatforms(newExpanded);
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="text-2xl flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Industry Benchmark Comparison
        </CardTitle>
        <CardDescription className="text-base">
          Compare your analytics against leading healthcare platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Dashboard Trends & Capabilities
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <li>• Real-time visualizations for no-show rates and patient acquisition</li>
                <li>• Exportable CSV reports with deep-dive filters</li>
                <li>• AI-native modeling for predictive insights</li>
                <li>• High-density, intuitive interfaces to minimize cognitive load</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {platforms.map((platform) => {
            const isExpanded = expandedPlatforms.has(platform.name);
            return (
              <Card key={platform.name} className="border-l-4 border-l-primary/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {platform.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {platform.insights}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePlatform(platform.name)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-sm text-primary">
                          For Specialists/Doctors
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {platform.specialistFeatures.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0 mt-1" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm text-primary">
                          For Clinics
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {platform.clinicFeatures.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <TrendingUp className="h-3 w-3 text-blue-500 flex-shrink-0 mt-1" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Ideas to Explore
                </p>
                <p className="text-sm text-green-700 dark:text-green-200">
                  Integrating NexHealth-style prebuilt dashboards with Practo's revenue tools can track
                  telemedicine metrics and reduce churn—potentially increasing clinic retention by aligning
                  with Doctoralia's engagement reports for better market entry in Brazil and EU.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
