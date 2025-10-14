import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Palette, Save } from 'lucide-react';

export default function WhiteLabelCustomization() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    logoUrl: '',
    companyName: '',
    domain: ''
  });

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('white-label-config', {
        body: {
          organization_id: 'org-123', // Would come from auth context
          branding_config: config
        }
      });

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: "White-label settings have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">White-Label Customization</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <Input
              value={config.companyName}
              onChange={(e) => setConfig({...config, companyName: e.target.value})}
              placeholder="Your Company Name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Custom Domain</label>
            <Input
              value={config.domain}
              onChange={(e) => setConfig({...config, domain: e.target.value})}
              placeholder="health.yourcompany.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Logo URL</label>
            <Input
              value={config.logoUrl}
              onChange={(e) => setConfig({...config, logoUrl: e.target.value})}
              placeholder="https://yourcdn.com/logo.png"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                  className="w-16 h-10"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                  placeholder="#6366f1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Secondary Color</label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                  className="w-16 h-10"
                />
                <Input
                  value={config.secondaryColor}
                  onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveConfig} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="font-medium mb-4">Preview</h4>
        <div 
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: config.primaryColor + '10',
            borderColor: config.primaryColor
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            {config.logoUrl && (
              <img src={config.logoUrl} alt="Logo" className="h-8" />
            )}
            <h3 className="text-lg font-semibold" style={{ color: config.primaryColor }}>
              {config.companyName || 'Your Company'}
            </h3>
          </div>
          <Button style={{ backgroundColor: config.primaryColor }}>
            Sample Button
          </Button>
        </div>
      </Card>
    </div>
  );
}
