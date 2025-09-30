import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function ClinicBranding() {
  const [loading, setLoading] = useState(false);
  const [clinic, setClinic] = useState<any>(null);
  const [formData, setFormData] = useState({
    brand_color: '#6366f1',
    brand_secondary_color: '#8b5cf6',
    tagline: '',
    mission_statement: '',
    video_url: '',
  });
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchClinic();
  }, [profile]);

  const fetchClinic = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('created_by', profile?.id)
        .single();

      if (error) throw error;
      
      setClinic(data);
      setFormData({
        brand_color: data.brand_color || '#6366f1',
        brand_secondary_color: data.brand_secondary_color || '#8b5cf6',
        tagline: data.tagline || '',
        mission_statement: data.mission_statement || '',
        video_url: data.video_url || '',
      });
    } catch (error: any) {
      console.error('Error fetching clinic:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('clinics')
        .update(formData)
        .eq('id', clinic.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Clinic branding updated successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Clinic Branding"
        description="Customize your clinic's brand identity"
      >
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brand_color">Primary Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="brand_color"
                    type="color"
                    value={formData.brand_color}
                    onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.brand_color}
                    onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_secondary_color">Secondary Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="brand_secondary_color"
                    type="color"
                    value={formData.brand_secondary_color}
                    onChange={(e) => setFormData({ ...formData, brand_secondary_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.brand_secondary_color}
                    onChange={(e) => setFormData({ ...formData, brand_secondary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Your clinic's motto or tagline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mission_statement">Mission Statement</Label>
              <Textarea
                id="mission_statement"
                value={formData.mission_statement}
                onChange={(e) => setFormData({ ...formData, mission_statement: e.target.value })}
                placeholder="Describe your clinic's mission and values"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">Promotional Video URL</Label>
              <Input
                id="video_url"
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="pt-4">
              <h3 className="font-semibold mb-4">Brand Preview</h3>
              <div 
                className="p-8 rounded-lg" 
                style={{ 
                  background: `linear-gradient(135deg, ${formData.brand_color}, ${formData.brand_secondary_color})`
                }}
              >
                <div className="bg-white rounded-lg p-6 text-center">
                  <h2 className="text-2xl font-bold mb-2">{clinic?.name || 'Your Clinic Name'}</h2>
                  {formData.tagline && (
                    <p className="text-muted-foreground mb-4">{formData.tagline}</p>
                  )}
                  {formData.mission_statement && (
                    <p className="text-sm text-muted-foreground">{formData.mission_statement}</p>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Branding'}
            </Button>
          </form>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}