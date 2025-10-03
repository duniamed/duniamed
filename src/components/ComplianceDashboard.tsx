import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, XCircle, AlertCircle, Globe, 
  Shield, Database, Languages, CreditCard,
  FileText, Building, Calendar, Heart
} from 'lucide-react';

interface JurisdictionCompliance {
  country: string;
  flag: string;
  status: 'complete' | 'partial' | 'not_started';
  completionPercentage: number;
  requirements: {
    name: string;
    status: 'complete' | 'partial' | 'missing';
    icon: any;
  }[];
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: string;
}

export default function ComplianceDashboard() {
  const jurisdictions: JurisdictionCompliance[] = [
    {
      country: 'United States (HIPAA)',
      flag: '🇺🇸',
      status: 'complete',
      completionPercentage: 100,
      priority: 'high',
      estimatedEffort: 'Complete',
      requirements: [
        { name: 'Data Encryption', status: 'complete', icon: Shield },
        { name: 'Access Controls', status: 'complete', icon: Shield },
        { name: 'Audit Logging', status: 'complete', icon: FileText },
        { name: 'Breach Notification', status: 'complete', icon: AlertCircle },
        { name: 'Patient Rights', status: 'complete', icon: Heart },
      ]
    },
    {
      country: 'Brazil (LGPD)',
      flag: '🇧🇷',
      status: 'complete',
      completionPercentage: 95,
      priority: 'high',
      estimatedEffort: 'Complete',
      requirements: [
        { name: 'Data Localization', status: 'complete', icon: Database },
        { name: 'Consent Management', status: 'complete', icon: FileText },
        { name: 'Right to Deletion', status: 'complete', icon: Shield },
        { name: 'Portuguese Language', status: 'complete', icon: Languages },
        { name: 'DPO Appointment', status: 'partial', icon: Building },
      ]
    },
    {
      country: 'European Union (GDPR)',
      flag: '🇪🇺',
      status: 'complete',
      completionPercentage: 100,
      priority: 'high',
      estimatedEffort: 'Complete',
      requirements: [
        { name: 'Data Minimization', status: 'complete', icon: Shield },
        { name: 'Data Portability', status: 'complete', icon: FileText },
        { name: 'Right to Erasure', status: 'complete', icon: Shield },
        { name: 'Breach Notification', status: 'complete', icon: AlertCircle },
        { name: 'Multi-Language', status: 'complete', icon: Languages },
      ]
    },
    {
      country: 'UAE',
      flag: '🇦🇪',
      status: 'partial',
      completionPercentage: 30,
      priority: 'high',
      estimatedEffort: '4 weeks',
      requirements: [
        { name: 'Arabic Language', status: 'missing', icon: Languages },
        { name: 'UAE Data Center', status: 'missing', icon: Database },
        { name: 'DHCC Compliance', status: 'missing', icon: Building },
        { name: 'Islamic Calendar', status: 'missing', icon: Calendar },
        { name: 'Sharia Payments', status: 'missing', icon: CreditCard },
      ]
    },
    {
      country: 'South Korea',
      flag: '🇰🇷',
      status: 'partial',
      completionPercentage: 20,
      priority: 'high',
      estimatedEffort: '6 weeks',
      requirements: [
        { name: 'Korean Language', status: 'missing', icon: Languages },
        { name: 'Korea Data Center', status: 'missing', icon: Database },
        { name: 'HIRA Integration', status: 'missing', icon: Building },
        { name: 'RRN Encryption', status: 'missing', icon: Shield },
        { name: 'Location Restrictions', status: 'missing', icon: Globe },
      ]
    },
    {
      country: 'Malaysia',
      flag: '🇲🇾',
      status: 'partial',
      completionPercentage: 25,
      priority: 'medium',
      estimatedEffort: '5 weeks',
      requirements: [
        { name: 'Multi-Language (MY)', status: 'missing', icon: Languages },
        { name: 'Malaysia Data Center', status: 'missing', icon: Database },
        { name: 'MyHEALTH Integration', status: 'missing', icon: Building },
        { name: 'Islamic Finance', status: 'missing', icon: CreditCard },
        { name: 'Halal Tracking', status: 'missing', icon: Heart },
      ]
    },
    {
      country: 'Indonesia',
      flag: '🇮🇩',
      status: 'partial',
      completionPercentage: 25,
      priority: 'medium',
      estimatedEffort: '5 weeks',
      requirements: [
        { name: 'Indonesian Language', status: 'missing', icon: Languages },
        { name: 'Indonesia Data Center', status: 'missing', icon: Database },
        { name: 'BPJS Integration', status: 'missing', icon: Building },
        { name: 'Islamic Finance', status: 'missing', icon: CreditCard },
        { name: 'PeduliLindungi', status: 'missing', icon: Heart },
      ]
    },
    {
      country: 'Uruguay',
      flag: '🇺🇾',
      status: 'partial',
      completionPercentage: 60,
      priority: 'low',
      estimatedEffort: '2 weeks',
      requirements: [
        { name: 'Spanish Language', status: 'complete', icon: Languages },
        { name: 'Data Residency', status: 'partial', icon: Database },
        { name: 'AGESIC Registration', status: 'missing', icon: Building },
        { name: 'HCEN Integration', status: 'missing', icon: Building },
        { name: 'FONASA Support', status: 'missing', icon: CreditCard },
      ]
    },
    {
      country: 'Costa Rica',
      flag: '🇨🇷',
      status: 'partial',
      completionPercentage: 55,
      priority: 'low',
      estimatedEffort: '2 weeks',
      requirements: [
        { name: 'Spanish Language', status: 'complete', icon: Languages },
        { name: 'Data Residency', status: 'partial', icon: Database },
        { name: 'CCSS Integration', status: 'missing', icon: Building },
        { name: 'Colegio Registration', status: 'missing', icon: Building },
        { name: 'Local Payments', status: 'missing', icon: CreditCard },
      ]
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'default';
      case 'partial': return 'secondary';
      case 'not_started': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'missing': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const overallCompletion = Math.round(
    jurisdictions.reduce((sum, j) => sum + j.completionPercentage, 0) / jurisdictions.length
  );

  const completeCount = jurisdictions.filter(j => j.status === 'complete').length;
  const partialCount = jurisdictions.filter(j => j.status === 'partial').length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Jurisdictions</p>
              <p className="text-3xl font-bold">{jurisdictions.length}</p>
            </div>
            <Globe className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fully Compliant</p>
              <p className="text-3xl font-bold text-green-600">{completeCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Partial Compliance</p>
              <p className="text-3xl font-bold text-amber-600">{partialCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-3xl font-bold">{overallCompletion}%</p>
            </div>
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Global Compliance Progress</h3>
        <Progress value={overallCompletion} className="h-3" />
        <p className="text-sm text-muted-foreground mt-2">
          {completeCount} of {jurisdictions.length} jurisdictions fully compliant
        </p>
      </Card>

      {/* Jurisdiction Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Jurisdiction-Specific Compliance</h3>
        
        {jurisdictions.map((jurisdiction) => (
          <Card key={jurisdiction.country} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{jurisdiction.flag}</span>
                  <div>
                    <h4 className="font-semibold text-lg">{jurisdiction.country}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusColor(jurisdiction.status)}>
                        {jurisdiction.status === 'complete' ? 'Compliant' : 
                         jurisdiction.status === 'partial' ? 'Partial' : 'Not Started'}
                      </Badge>
                      <Badge variant={getPriorityColor(jurisdiction.priority)}>
                        {jurisdiction.priority.toUpperCase()} Priority
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Est. {jurisdiction.estimatedEffort}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{jurisdiction.completionPercentage}%</p>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>

              {/* Progress Bar */}
              <Progress value={jurisdiction.completionPercentage} className="h-2" />

              {/* Requirements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
                {jurisdiction.requirements.map((req) => {
                  const Icon = req.icon;
                  return (
                    <div
                      key={req.name}
                      className={`p-3 rounded-lg border ${
                        req.status === 'complete' ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' :
                        req.status === 'partial' ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' :
                        'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-4 w-4" />
                        {getStatusIcon(req.status)}
                      </div>
                      <p className="text-sm font-medium">{req.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Items */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Next Steps for Full Compliance</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Languages className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Phase 1: Language Localization (2-3 weeks)</p>
              <p className="text-sm text-muted-foreground">
                Add Arabic, Korean, Malay, Mandarin, Tamil, and Indonesian translations
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Database className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Phase 2: Data Residency (3-4 weeks)</p>
              <p className="text-sm text-muted-foreground">
                Deploy regional Supabase instances in UAE, South Korea, Malaysia, and Indonesia
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Building className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Phase 3: Healthcare Integrations (6-8 weeks)</p>
              <p className="text-sm text-muted-foreground">
                Integrate with HIRA, MyHEALTH, BPJS, HCEN, and CCSS systems
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <CreditCard className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Phase 4: Payment Localization (2-3 weeks)</p>
              <p className="text-sm text-muted-foreground">
                Add support for local currencies and Islamic banking options
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Heart className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Phase 5: Cultural Adaptations (2-3 weeks)</p>
              <p className="text-sm text-muted-foreground">
                Implement Islamic calendar, prayer times, halal tracking, and gender preferences
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}