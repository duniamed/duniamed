import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Mail, Video, Send, Share2, CreditCard, Clock, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  logo: string;
  description: string;
  status: 'available' | 'connected' | 'coming_soon';
  category: string;
}

const integrations: Integration[] = [
  // Calendar & Scheduling
  { id: 'google_calendar', name: 'Google Calendar', logo: 'https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png', description: 'Sync appointments with Google Calendar', status: 'available', category: 'calendar' },
  { id: 'outlook', name: 'Microsoft Outlook', logo: 'https://img.icons8.com/fluency/96/microsoft-outlook-2019.png', description: 'Sync with Outlook Calendar', status: 'available', category: 'calendar' },
  { id: 'apple_calendar', name: 'Apple Calendar', logo: 'https://img.icons8.com/color/96/apple-calendar--v1.png', description: 'iCloud Calendar integration', status: 'available', category: 'calendar' },
  { id: 'office365', name: 'Office 365', logo: 'https://img.icons8.com/color/96/office-365.png', description: 'Enterprise calendar sync', status: 'available', category: 'calendar' },
  { id: 'calendly', name: 'Calendly', logo: 'https://img.icons8.com/color/96/calendly.png', description: 'Embed Calendly scheduler', status: 'available', category: 'calendar' },
  { id: 'acuity', name: 'Acuity Scheduling', logo: 'https://acuityscheduling.com/favicon.ico', description: 'Acuity booking integration', status: 'coming_soon', category: 'calendar' },
  
  // Communication
  { id: 'whatsapp_business', name: 'WhatsApp Business', logo: 'https://img.icons8.com/color/96/whatsapp--v1.png', description: 'Send appointment reminders via WhatsApp', status: 'available', category: 'communication' },
  { id: 'telegram', name: 'Telegram', logo: 'https://img.icons8.com/color/96/telegram-app--v1.png', description: 'Telegram bot for patient notifications', status: 'available', category: 'communication' },
  { id: 'signal', name: 'Signal', logo: 'https://img.icons8.com/color/96/signal-app.png', description: 'HIPAA-compliant messaging', status: 'coming_soon', category: 'communication' },
  { id: 'slack', name: 'Slack', logo: 'https://img.icons8.com/color/96/slack-new.png', description: 'Team collaboration for clinics', status: 'available', category: 'communication' },
  { id: 'teams', name: 'Microsoft Teams', logo: 'https://img.icons8.com/color/96/microsoft-teams.png', description: 'Enterprise team communication', status: 'available', category: 'communication' },
  { id: 'discord', name: 'Discord', logo: 'https://img.icons8.com/color/96/discord-logo.png', description: 'Patient community channels', status: 'available', category: 'communication' },
  
  // Email
  { id: 'sendgrid', name: 'SendGrid', logo: 'https://img.icons8.com/color/96/sendgrid.png', description: 'Transactional email delivery', status: 'available', category: 'email' },
  { id: 'mailgun', name: 'Mailgun', logo: 'https://www.mailgun.com/wp-content/uploads/2020/10/mailgun-logo-300px.png', description: 'Email API service', status: 'available', category: 'email' },
  { id: 'amazon_ses', name: 'Amazon SES', logo: 'https://img.icons8.com/color/96/amazon-web-services.png', description: 'AWS email service', status: 'available', category: 'email' },
  { id: 'postmark', name: 'Postmark', logo: 'https://postmarkapp.com/images/logo.svg', description: 'HIPAA-compliant emails', status: 'available', category: 'email' },
  
  // Video Conferencing
  { id: 'zoom', name: 'Zoom Healthcare', logo: 'https://img.icons8.com/color/96/zoom.png', description: 'HIPAA-compliant video calls', status: 'available', category: 'video' },
  { id: 'doxy', name: 'Doxy.me', logo: 'https://doxy.me/favicon.ico', description: 'Telemedicine platform', status: 'coming_soon', category: 'video' },
  { id: 'twilio_video', name: 'Twilio Video', logo: 'https://www.twilio.com/content/dam/twilio-com/global/en/products/video/video.svg', description: 'Programmable video rooms', status: 'available', category: 'video' },
  
  // SMS
  { id: 'vonage', name: 'Vonage', logo: 'https://img.icons8.com/color/96/vonage.png', description: 'SMS notifications', status: 'available', category: 'sms' },
  { id: 'plivo', name: 'Plivo', logo: 'https://www.plivo.com/images/plivo-logo.svg', description: 'SMS API platform', status: 'available', category: 'sms' },
  { id: 'messagebird', name: 'MessageBird', logo: 'https://messagebird.com/assets/images/og-messagebird.png', description: 'Multi-channel messaging', status: 'available', category: 'sms' },
  
  // Social Media
  { id: 'google_business', name: 'Google Business Profile', logo: 'https://img.icons8.com/color/96/google-logo.png', description: 'Manage Google My Business', status: 'connected', category: 'social' },
  { id: 'instagram', name: 'Instagram Business', logo: 'https://img.icons8.com/fluency/96/instagram-new.png', description: 'Post clinic updates', status: 'available', category: 'social' },
  { id: 'facebook', name: 'Facebook Pages', logo: 'https://img.icons8.com/fluency/96/facebook-new.png', description: 'Manage Facebook presence', status: 'available', category: 'social' },
  { id: 'twitter', name: 'X (Twitter)', logo: 'https://img.icons8.com/color/96/twitter--v1.png', description: 'Share health tips', status: 'available', category: 'social' },
  { id: 'linkedin', name: 'LinkedIn', logo: 'https://img.icons8.com/color/96/linkedin.png', description: 'Professional networking', status: 'available', category: 'social' },
  { id: 'yelp', name: 'Yelp for Business', logo: 'https://img.icons8.com/color/96/yelp.png', description: 'Manage reviews', status: 'available', category: 'social' },
  { id: 'healthgrades', name: 'Healthgrades', logo: 'https://www.healthgrades.com/favicon.ico', description: 'Provider profile management', status: 'coming_soon', category: 'social' },
  { id: 'zocdoc', name: 'Zocdoc', logo: 'https://www.zocdoc.com/favicon.ico', description: 'Online appointment booking', status: 'coming_soon', category: 'social' },
  
  // Payments
  { id: 'paypal', name: 'PayPal', logo: 'https://img.icons8.com/color/96/paypal.png', description: 'Accept PayPal payments', status: 'available', category: 'payment' },
  { id: 'square', name: 'Square', logo: 'https://img.icons8.com/color/96/square.png', description: 'Point of sale & payments', status: 'available', category: 'payment' },
  { id: 'mercado_pago', name: 'Mercado Pago', logo: 'https://http2.mlstatic.com/static/org-img/homesnw/mercado-pago.png', description: 'Latin America payments', status: 'available', category: 'payment' },
  { id: 'razorpay', name: 'Razorpay', logo: 'https://razorpay.com/assets/razorpay-glyph.svg', description: 'India payment gateway', status: 'available', category: 'payment' },
  
  // Marketing
  { id: 'mailchimp', name: 'Mailchimp', logo: 'https://img.icons8.com/color/96/mailchimp.png', description: 'Email marketing campaigns', status: 'available', category: 'marketing' },
  { id: 'hubspot', name: 'HubSpot', logo: 'https://img.icons8.com/color/96/hubspot.png', description: 'CRM & marketing automation', status: 'available', category: 'marketing' },
  { id: 'activecampaign', name: 'ActiveCampaign', logo: 'https://www.activecampaign.com/favicon.ico', description: 'Customer experience automation', status: 'coming_soon', category: 'marketing' },
  
  // Analytics
  { id: 'google_analytics', name: 'Google Analytics 4', logo: 'https://img.icons8.com/color/96/google-analytics.png', description: 'Website analytics', status: 'available', category: 'analytics' },
  { id: 'mixpanel', name: 'Mixpanel', logo: 'https://img.icons8.com/color/96/mixpanel.png', description: 'Product analytics', status: 'available', category: 'analytics' },
  { id: 'segment', name: 'Segment', logo: 'https://segment.com/favicon.ico', description: 'Customer data platform', status: 'coming_soon', category: 'analytics' },
  { id: 'hotjar', name: 'Hotjar', logo: 'https://img.icons8.com/color/96/hotjar.png', description: 'User behavior analytics', status: 'available', category: 'analytics' },
  
  // Support
  { id: 'intercom', name: 'Intercom', logo: 'https://img.icons8.com/color/96/intercom.png', description: 'Customer messaging platform', status: 'available', category: 'support' },
  { id: 'zendesk', name: 'Zendesk', logo: 'https://img.icons8.com/color/96/zendesk.png', description: 'Customer support ticketing', status: 'available', category: 'support' },
  { id: 'freshdesk', name: 'Freshdesk', logo: 'https://www.freshworks.com/favicon.ico', description: 'Help desk software', status: 'coming_soon', category: 'support' },
];

const categories = [
  { id: 'calendar', label: 'Calendar & Scheduling', icon: Calendar, count: integrations.filter(i => i.category === 'calendar').length },
  { id: 'communication', label: 'Communication', icon: MessageSquare, count: integrations.filter(i => i.category === 'communication').length },
  { id: 'email', label: 'Email', icon: Mail, count: integrations.filter(i => i.category === 'email').length },
  { id: 'video', label: 'Video Conferencing', icon: Video, count: integrations.filter(i => i.category === 'video').length },
  { id: 'sms', label: 'SMS', icon: Send, count: integrations.filter(i => i.category === 'sms').length },
  { id: 'social', label: 'Social Media & Reviews', icon: Share2, count: integrations.filter(i => i.category === 'social').length },
  { id: 'payment', label: 'Payments', icon: CreditCard, count: integrations.filter(i => i.category === 'payment').length },
  { id: 'marketing', label: 'Marketing', icon: TrendingUp, count: integrations.filter(i => i.category === 'marketing').length },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, count: integrations.filter(i => i.category === 'analytics').length },
  { id: 'support', label: 'Customer Support', icon: Users, count: integrations.filter(i => i.category === 'support').length },
];

export default function IntegrationHub() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState('calendar');

  const handleConnect = (integration: Integration) => {
    if (integration.status === 'coming_soon') {
      toast({
        title: 'Coming Soon',
        description: `${integration.name} integration will be available soon!`,
      });
      return;
    }

    if (integration.status === 'connected') {
      toast({
        title: 'Already Connected',
        description: `${integration.name} is already connected to your account.`,
      });
      return;
    }

    toast({
      title: 'Connecting...',
      description: `Redirecting to ${integration.name} authorization...`,
    });
  };

  const filteredIntegrations = integrations.filter(i => i.category === activeCategory);

  return (
    <DashboardLayout
      title="Integration Hub"
      description="Connect 50+ services to automate your workflow"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Integrations</CardDescription>
              <CardTitle className="text-3xl">{integrations.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Connected</CardDescription>
              <CardTitle className="text-3xl">{integrations.filter(i => i.status === 'connected').length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Available</CardDescription>
              <CardTitle className="text-3xl">{integrations.filter(i => i.status === 'available').length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Categories */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 h-auto">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex flex-col items-center gap-1 py-3"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{category.label}</span>
                  <Badge variant="secondary" className="text-xs">{category.count}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map(integration => (
                  <Card key={integration.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={integration.logo}
                            alt={integration.name}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            {integration.status === 'connected' && (
                              <Badge variant="default" className="mt-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                            {integration.status === 'coming_soon' && (
                              <Badge variant="secondary" className="mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-2">{integration.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleConnect(integration)}
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                        className="w-full"
                        disabled={integration.status === 'coming_soon'}
                      >
                        {integration.status === 'connected' ? 'Manage' : integration.status === 'coming_soon' ? 'Coming Soon' : 'Connect'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
